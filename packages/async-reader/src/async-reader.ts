import type { Stats } from 'fs';
import type { FileHandle } from 'fs/promises';

import type { DataValue, Read, Struct } from '@nishin/reader';
import { BinaryReader, ByteOrder, DataType, Encoding } from '@nishin/reader';
import { assertInt } from '@nishin/reader/assert';
import { DataArray, DataBigInt, DataBoolean, DataChar, DataFloat, DataInt, DataString } from '@nishin/reader/data';

import { repeatAsync } from './repeat-async.js';

type ReadWrite<T> = {
	-readonly [P in keyof T]: T[P];
};

interface Config {
	readonly bufferSize: number;
}

export class AsyncReader {
	#fileHandle: FileHandle;
	#bufferSize: number;
	#reader: BinaryReader;

	#dataRead = false;
	#offset = 0;

	#stats?: Stats;

	get #fileSize(): Promise<number> {
		if (!this.#stats) {
			return this.#fileHandle.stat().then((stats) => {
				this.#stats = stats;
				return stats.size;
			});
		}

		return Promise.resolve(this.#stats.size);
	}

	get offset(): number {
		return this.#offset;
	}

	get byteOrder(): ByteOrder | undefined {
		return this.#reader.byteOrder;
	}

	get buffer(): Uint8Array {
		return this.#reader.buffer;
	}

	constructor(fileHandle: FileHandle, byteOrder?: ByteOrder, { bufferSize }?: Config);
	constructor(fileHandle: FileHandle, { bufferSize }: Config);
	constructor(fileHandle: FileHandle, byteOrderOrConfig?: ByteOrder | Config, { bufferSize = 2 ** 20 * 10 } = {}) {
		const byteOrder = byteOrderOrConfig instanceof ByteOrder ? byteOrderOrConfig : undefined;

		this.#bufferSize = byteOrderOrConfig instanceof ByteOrder ? bufferSize : byteOrderOrConfig?.bufferSize ?? bufferSize;

		this.#fileHandle = fileHandle;
		this.#reader = new BinaryReader(Buffer.alloc(this.#bufferSize), byteOrder);
	}

	async #prepareOffset(delta: number, position = this.#offset + delta) {
		if (!this.#dataRead || this.#reader.offset + delta < 0 || this.#reader.offset + delta >= this.#reader.buffer.length) {
			this.#reader = new BinaryReader(Buffer.alloc(this.#bufferSize), this.byteOrder);

			const { bytesRead } = await this.#fileHandle.read({
				buffer: this.#reader.buffer,
				length: this.#bufferSize,
				position,
			});

			if (bytesRead < this.#bufferSize) {
				this.#reader = this.#reader.slice(bytesRead);
			}

			this.#dataRead = true;
		}
	}

	setByteOrder(byteOrder: ByteOrder): void {
		this.#reader.setByteOrder(byteOrder);
	}

	async slice(size: number): Promise<BinaryReader> {
		await this.skip(size);
		const buffer = Buffer.alloc(size);

		await this.#fileHandle.read({
			buffer,
			length: size,
			position: this.#offset - size,
		});

		return new BinaryReader(buffer, this.byteOrder);
	}

	async seek(offset: number): Promise<void> {
		assertInt(offset, { min: 0, max: (await this.#fileSize) - 1 });
		await this.#prepareOffset(offset - this.#offset);
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

		this.setByteOrder(byteOrder);
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
				await this.#prepareOffset(1, this.#offset);
				const result = this.#reader.next(type) as DataValue<unknown>;
				this.#offset += result.byteLength;
				return result as Read<T>;
			}

			if (type instanceof DataInt || type instanceof DataBigInt || type instanceof DataFloat) {
				await this.#prepareOffset(type.byteLength, this.#offset);
				const result = this.#reader.next(type) as DataValue<unknown>;
				this.#offset += result.byteLength;
				return result as Read<T>;
			}

			if (type instanceof DataChar) {
				await this.#prepareOffset(type.encoding.maxBytes, this.#offset);
				const result = this.#reader.next(type) as DataValue<unknown>;
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
				const result: ReadWrite<DataValue<string>> = {
					value: '',
					byteLength: 0,
				};

				let char = await this.next(charType);

				// eslint-disable-next-line no-await-in-loop
				while (char.value !== terminator && this.#offset < (await this.#fileSize)) {
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

				return items.reduce<ReadWrite<DataValue<unknown[]>>>(
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
