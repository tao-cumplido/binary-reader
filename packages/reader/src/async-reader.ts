import { assertInt } from "./assert.js";
import { ByteOrder } from "./byte-order.js";
import { DataType } from "./data-type.js";
import { Encoding } from "./encoding.js";
import { ReadError } from "./read-error.js";
import { ReadMode } from "./read-mode.js";
import type { AsyncDataReaderLike, BytesValue } from "./types.js";

export interface AsyncReaderConfig {
	readonly bufferSize: number;
}

export type UpdateBuffer<Buffer extends Uint8Array> = (state: { offset: number; size: number; }) => Promise<Buffer>;

export class AsyncReader<Buffer extends Uint8Array = Uint8Array> {
	#byteLength: number;
	#updateBuffer: UpdateBuffer<Buffer>;
	#bufferSize: number;
	#byteOrder: ByteOrder | undefined;
	#buffer?: Buffer;

	#bufferStart = 0;
	#offset = 0;

	get bufferStart(): number {
		return this.#bufferStart;
	}

	get offset(): number {
		return this.#offset;
	}

	get byteLength(): number {
		return this.#byteLength;
	}

	get byteOrder(): ByteOrder | undefined {
		return this.#byteOrder;
	}

	constructor(byteLength: number, updateBuffer: UpdateBuffer<Buffer>, byteOrder?: ByteOrder, config?: AsyncReaderConfig);
	constructor(byteLength: number, updateBuffer: UpdateBuffer<Buffer>, config: AsyncReaderConfig);
	constructor(
		byteLength: number,
		updateBuffer: UpdateBuffer<Buffer>,
		byteOrderOrConfig?: ByteOrder | AsyncReaderConfig,
		{ bufferSize = 2 ** 20 * 10, } = {},
	) {
		this.#byteLength = byteLength;
		this.#updateBuffer = updateBuffer;
		this.#byteOrder = byteOrderOrConfig instanceof ByteOrder ? byteOrderOrConfig : undefined;
		this.#bufferSize = byteOrderOrConfig instanceof ByteOrder ? bufferSize : byteOrderOrConfig?.bufferSize ?? bufferSize;
	}

	async #checkBufferBounds(delta: number, position = this.#offset + delta) {
		const buffer = await this.getBuffer();

		const bufferOffset = this.#offset - this.#bufferStart;

		if (bufferOffset + delta < 0 || bufferOffset + delta >= buffer.byteLength) {
			this.#buffer = await this.#updateBuffer({ offset: position, size: this.#bufferSize, });
			this.#bufferStart = position;
		}

		this.#offset = position;
	}

	async getBuffer(): Promise<Buffer> {
		if (!this.#buffer) {
			this.#buffer = await this.#updateBuffer({ offset: 0, size: this.#bufferSize, });
		}

		return this.#buffer;
	}

	hasNext(byteLength = 1): boolean {
		assertInt(byteLength, { min: 1, });
		return this.#offset + byteLength <= this.#byteLength;
	}

	setByteOrder(byteOrder: ByteOrder): void {
		this.#byteOrder = byteOrder;
	}

	async slice(size: number): Promise<AsyncReader<Buffer>> {
		await this.skip(size);
		const currentOffset = this.#offset;
		return new AsyncReader(
			size,
			async ({ offset, }) => this.#updateBuffer({ offset: currentOffset - size + offset, size: this.#bufferSize, }),
			this.#byteOrder,
			{ bufferSize: this.#bufferSize, },
		);
	}

	async seek(offset: number): Promise<void> {
		assertInt(offset, { min: 0, max: this.#byteLength, });
		const delta = offset - this.#offset;
		await this.#checkBufferBounds(delta);
	}

	async skip(bytes: number): Promise<void> {
		assertInt(bytes, { min: 0, });
		await this.seek(this.#offset + bytes);
	}

	async align(to: number): Promise<void> {
		assertInt(to, { min: 0, });
		await this.skip(((-this.offset % to) + to) % to);
	}

	async readByteOrderMark(offset = this.#offset): Promise<void> {
		await this.seek(offset);

		const value = await this.next(DataType.int({ signed: false, byteLength: 2, }, ByteOrder.BigEndian));

		const byteOrder = ByteOrder.lookupKey(value);

		if (!byteOrder) {
			throw new TypeError(`invalid byte order mark`);
		}

		this.setByteOrder(byteOrder);
	}

	async assertMagic(magic: string | Uint8Array, offset = this.#offset): Promise<void> {
		await this.seek(offset);

		if (typeof magic === "string") {
			const value = await this.next(DataType.string(Encoding.ASCII, { count: magic.length, }));
			if (magic !== value) {
				throw new TypeError(`invalid magic: expected '${magic}', got '${value}`);
			}
		} else {
			const value = await this.next(DataType.bytes(magic.length));

			for (let i = 0; i < value.length; i++) {
				if (value[i] !== magic[i]) {
					throw new TypeError(
						`invalid magic: expected 0x${magic[i]?.toString(16).padStart(2, "0")} at position ${i}, got 0x${value[i]
							?.toString(16)
							.padStart(2, "0")}`,
					);
				}
			}
		}
	}

	async next<Value>(type: AsyncDataReaderLike<Value>, mode: typeof ReadMode.Source): Promise<BytesValue<Value>>;
	async next<Value>(type: AsyncDataReaderLike<Value>, mode?: typeof ReadMode.Value): Promise<Value>;
	async next<Value>(
		type: AsyncDataReaderLike<Value>,
		mode: ReadMode = ReadMode.Value,
	): Promise<BytesValue<Value> | Value> {
		const read = typeof type === "function" ? type : type.async ?? type.sync;

		if (!read) {
			throw new Error(`invalid state: missing reader function`);
		}

		if (type.maxRequiredBytes) {
			await this.#checkBufferBounds(type.maxRequiredBytes, this.#offset);
		}

		const initialOffset = this.#offset;

		try {
			const buffer = await this.getBuffer();

			const result = await read(
				{
					buffer,
					offset: this.#offset - this.#bufferStart,
					byteOrder: this.#byteOrder,
				},
				async (value) => {
					await this.#checkBufferBounds(value);
					return {
						buffer: await this.getBuffer(),
						offset: this.#offset - this.#bufferStart,
					};
				},
			);

			await this.seek(initialOffset + result.source.byteLength);

			switch (mode) {
				case ReadMode.Source:
					return result;
				case ReadMode.Value:
					return result.value;
			}

			throw new ReadError(`unknown read mode`, result.source);
		} catch (error) {
			await this.seek(initialOffset);
			throw error;
		}
	}
}
