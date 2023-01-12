import type { DataValue, Read, Struct } from './binary-reader.js';
import type { Mutable } from './types.js';
import { assertInt } from './assert.js';
import { BinaryReader } from './binary-reader.js';
import { ByteOrder } from './byte-order.js';
import {
	DataArray,
	DataBigInt,
	DataBoolean,
	DataChar,
	DataFloat,
	DataInt,
	DataString,
	DataType,
} from './data/index.js';
import { Encoding } from './encoding.js';
import { repeatAsync } from './repeat.js';

export interface AsyncReaderConfig {
	readonly bufferSize: number;
}

export type UpdateBuffer<Buffer extends Uint8Array> = (state: { offset: number; size: number }) => Promise<Buffer>;

export class AsyncReader<Buffer extends Uint8Array = Uint8Array> {
	#byteLength: number;
	#updateBuffer: UpdateBuffer<Buffer>;
	#bufferSize: number;
	#byteOrder?: ByteOrder;
	#reader?: BinaryReader<Buffer>;

	#offset = 0;

	get offset(): number {
		return this.#offset;
	}

	get byteLength(): number {
		return this.#byteLength;
	}

	get byteOrder(): ByteOrder | undefined {
		return this.#byteOrder;
	}

	constructor(
		byteLength: number,
		updateBuffer: UpdateBuffer<Buffer>,
		byteOrder?: ByteOrder,
		{ bufferSize }?: AsyncReaderConfig,
	);
	constructor(byteLength: number, updateBuffer: UpdateBuffer<Buffer>, { bufferSize }: AsyncReaderConfig);
	constructor(
		byteLength: number,
		updateBuffer: UpdateBuffer<Buffer>,
		byteOrderOrConfig?: ByteOrder | AsyncReaderConfig,
		{ bufferSize = 2 ** 20 * 10 } = {},
	) {
		this.#byteLength = byteLength;
		this.#updateBuffer = updateBuffer;
		this.#byteOrder = byteOrderOrConfig instanceof ByteOrder ? byteOrderOrConfig : undefined;
		this.#bufferSize = byteOrderOrConfig instanceof ByteOrder ? bufferSize : byteOrderOrConfig?.bufferSize ?? bufferSize;
	}

	async #getReader() {
		if (!this.#reader) {
			this.#reader = new BinaryReader(await this.#updateBuffer({ offset: 0, size: this.#bufferSize }), this.#byteOrder);
		}

		return this.#reader;
	}

	async #checkBufferBounds(delta: number, position = this.#offset + delta) {
		const reader = await this.#getReader();

		if (reader.offset + delta < 0 || reader.offset + delta >= reader.buffer.length) {
			this.#reader = new BinaryReader(
				await this.#updateBuffer({ offset: position, size: this.#bufferSize }),
				this.#byteOrder,
			);
			return false;
		}

		return true;
	}

	async getBuffer(): Promise<Buffer> {
		const reader = await this.#getReader();
		return reader.buffer;
	}

	hasNext(byteLength = 1): boolean {
		assertInt(byteLength, { min: 1 });
		return this.#offset + byteLength <= this.#byteLength;
	}

	async setByteOrder(byteOrder: ByteOrder): Promise<void> {
		const reader = await this.#getReader();
		reader.setByteOrder(byteOrder);
	}

	async slice(size: number): Promise<AsyncReader<Buffer>> {
		await this.skip(size);
		const currentOffset = this.#offset;
		return new AsyncReader(
			size,
			async ({ offset }) => this.#updateBuffer({ offset: currentOffset - size + offset, size: this.#bufferSize }),
			this.#byteOrder,
			{ bufferSize: this.#bufferSize },
		);
	}

	async seek(offset: number): Promise<void> {
		assertInt(offset, { min: 0, max: this.#byteLength });
		const delta = offset - this.#offset;
		if (await this.#checkBufferBounds(delta)) {
			const reader = await this.#getReader();
			reader.seek(reader.offset + delta);
		}
		this.#offset = offset;
	}

	async skip(bytes: number): Promise<void> {
		assertInt(bytes, { min: 0 });
		await this.seek(this.#offset + bytes);
	}

	async align(to: number): Promise<void> {
		assertInt(to, { min: 0 });
		await this.skip(((-this.offset % to) + to) % to);
	}

	async readByteOrderMark(offset = this.#offset): Promise<void> {
		await this.seek(offset);

		const { value } = await this.next(DataType.int({ signed: false, byteLength: 2 }, ByteOrder.BigEndian));

		const byteOrder = ByteOrder.lookupValue(value);

		if (!byteOrder) {
			throw new TypeError(`invalid byte order mark`);
		}

		return this.setByteOrder(byteOrder);
	}

	async assertMagic(magic: string | Uint8Array, offset = this.#offset): Promise<void> {
		await this.seek(offset);

		if (typeof magic === 'string') {
			const { value } = await this.next(DataType.string(Encoding.ASCII, { count: magic.length }));
			if (magic !== value) {
				throw new TypeError(`invalid magic: expected '${magic}', got '${value}`);
			}
		} else {
			const { value } = await this.next(DataType.array(DataType.Uint8, magic.length));

			for (let i = 0; i < value.length; i++) {
				if (value[i] !== magic[i]) {
					throw new TypeError(
						// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
						`invalid magic: expected 0x${magic[i]?.toString(16).padStart(2, '0')} at position ${i}, got 0x${value[i]
							?.toString(16)
							.padStart(2, '0')}`,
					);
				}
			}
		}
	}

	async next<T extends DataType | Struct>(type: T): Promise<Read<T>> {
		/* eslint-disable @typescript-eslint/consistent-type-assertions */

		const initialOffset = this.#offset;

		try {
			if (type instanceof DataBoolean) {
				await this.#checkBufferBounds(1, this.#offset);
				const reader = await this.#getReader();
				const result = reader.next(type) as DataValue<unknown>;
				this.#offset += result.byteLength;
				return result as Read<T>;
			}

			if (type instanceof DataInt || type instanceof DataBigInt || type instanceof DataFloat) {
				await this.#checkBufferBounds(type.byteLength, this.#offset);
				const reader = await this.#getReader();
				const result = reader.next(type) as DataValue<unknown>;
				this.#offset += result.byteLength;
				return result as Read<T>;
			}

			if (type instanceof DataChar) {
				await this.#checkBufferBounds(type.encoding.maxBytes, this.#offset);
				const reader = await this.#getReader();
				const result = reader.next(type) as DataValue<unknown>;
				this.#offset += result.byteLength;
				return result as Read<T>;
			}

			if (type instanceof DataString) {
				const { encoding, byteOrder, terminator, count } = type;

				const charType = DataType.char(encoding, byteOrder);

				if (count > 0) {
					const { value, byteLength } = await this.next(DataType.array(charType, count));
					return {
						value: value.join(''),
						byteLength,
					} as Read<T>;
				}

				// eslint-disable-next-line @typescript-eslint/no-shadow
				const result: Mutable<DataValue<string>> = {
					value: '',
					byteLength: 0,
				};

				let char = await this.next(charType);

				// eslint-disable-next-line no-await-in-loop
				while (char.value !== terminator && this.#offset < this.#byteLength) {
					result.value += char.value;
					result.byteLength += char.byteLength;
					// eslint-disable-next-line no-await-in-loop
					char = await this.next(charType);
				}

				if (char.value !== terminator) {
					result.value += char.value;
				}

				result.byteLength += char.byteLength;

				return result as Read<T>;
			}

			if (type instanceof DataArray) {
				const items = await repeatAsync(type.count, async () => this.next(type.type) as Promise<DataValue<unknown>>);

				return items.reduce<Mutable<DataValue<unknown[]>>>(
					(result, item) => {
						result.value.push(item.value);
						result.byteLength += item.byteLength;
						return result;
					},
					{
						value: [],
						byteLength: 0,
					},
				) as Read<T>;
			}

			if (type instanceof DataType) {
				throw new TypeError(`unsupported data type`);
			}

			if (Array.isArray(type)) {
				const result = [];

				for (const item of type) {
					if (!(item instanceof DataType)) {
						throw new TypeError(`struct array contains items which are not an instance of DataType`);
					}

					// eslint-disable-next-line no-await-in-loop
					result.push(await this.next(item));
				}

				return result as Read<T>;
			}

			const entries = [];

			for (const [key, item] of Object.entries(type)) {
				if (!(item instanceof DataType)) {
					throw new TypeError(`struct object contains items which are not an instance of DataType`);
				}

				// eslint-disable-next-line no-await-in-loop
				entries.push([key, await this.next(item)] as const);
			}

			return Object.fromEntries(entries) as Read<T>;
		} catch (error) {
			this.#offset = initialOffset;
			throw error;
		}

		/* eslint-enable @typescript-eslint/consistent-type-assertions */
	}
}
