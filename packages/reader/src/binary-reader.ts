import { assertInt } from "./assert.js";
import { ByteOrder } from "./byte-order.js";
import { DataType } from "./data-type.js";
import { Encoding } from "./encoding.js";
import { MatchError, matchPattern } from "./pattern/match.js";
import { ReadError } from "./read-error.js";
import { ReadMode } from "./read-mode.js";
import type { BytesValue, SyncDataReaderLike, SyncSearchItem } from "./types.js";

export class BinaryReader<Buffer extends Uint8Array = Uint8Array> {
	#offset = 0;

	#buffer: Buffer;
	#byteOrder: ByteOrder | undefined;

	get offset(): number {
		return this.#offset;
	}

	get byteLength(): number {
		return this.#buffer.length;
	}

	get buffer(): Buffer {
		return this.#buffer;
	}

	get byteOrder(): ByteOrder | undefined {
		return this.#byteOrder;
	}

	constructor(source: Buffer, byteOrder?: ByteOrder) {
		this.#buffer = source;
		this.#byteOrder = byteOrder;
	}

	/**
	 * Query whether there are any bytes left to read. The number of bytes to query defaults to 1.
	 */
	hasNext(byteLength = 1): boolean {
		assertInt(byteLength, { min: 1, });
		return this.#offset + byteLength <= this.#buffer.length;
	}

	/**
	 * Sets the byte order on the reader instance manually.
	 */
	setByteOrder(byteOrder: ByteOrder): void {
		this.#byteOrder = byteOrder;
	}

	/**
	 * Reads the byte order mark from the given offset and sets the byte order on the reader instance.
	 * Advances the read offset by 2 bytes on succes, throws an error otherwise.
	 */
	readByteOrderMark(offset = this.#offset): void {
		this.seek(offset);

		const byteOrder = ByteOrder.lookupKey(
			this.next(DataType.int({ signed: false, byteLength: 2, }, ByteOrder.BigEndian)),
		);

		if (!byteOrder) {
			throw new TypeError(`invalid byte order mark`);
		}

		this.setByteOrder(byteOrder);
	}

	/**
	 * Asserts that the source buffer contains the given magic in ASCII encoding or raw bytes at the given offset.
	 * Advances the read offset accordingly on succes, throws an error otherwise.
	 */
	assertMagic(magic: string | Uint8Array, offset = this.#offset): void {
		this.seek(offset);

		if (typeof magic === "string") {
			const value = this.next(DataType.string(Encoding.ASCII, { count: magic.length, }));
			if (magic !== value) {
				throw new TypeError(`invalid magic: expected '${magic}', got '${value}`);
			}
		} else {
			const value = this.next(DataType.bytes(magic.length));
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

	/**
	 * Creates copy of the reader from the current read offset with the given size and advances read offset by given size.
	 * Note that the copy's underlying buffer still references the same memory.
	 */
	slice(size: number): BinaryReader<Buffer> {
		this.skip(size);
		const reader = new BinaryReader(this.#buffer.subarray(this.#offset - size, this.#offset) as Buffer, this.#byteOrder);
		return reader;
	}

	/**
	 * Set the read offset.
	 */
	seek(offset: number): void {
		assertInt(offset, { min: 0, max: this.#buffer.length, });
		this.#offset = offset;
	}

	/**
	 * Advance the read offset by number of bytes given.
	 */
	skip(bytes: number): void {
		assertInt(bytes, { min: 0, });
		this.seek(this.#offset + bytes);
	}

	/**
	 * Align the read offset to the nearest multiple.
	 */
	align(to: number): void {
		assertInt(to, { min: 0, });
		this.skip(((-this.#offset % to) + to) % to);
	}

	/**
	 * Read the next value of the given type and advance the read offset by numbers of bytes processed.
	 */
	next<Value>(type: SyncDataReaderLike<Value>, mode: typeof ReadMode.Source): BytesValue<Value>;
	next<Value>(type: SyncDataReaderLike<Value>, mode?: typeof ReadMode.Value): Value;
	next<Value>(type: SyncDataReaderLike<Value>, mode: ReadMode = ReadMode.Value): BytesValue<Value> | Value {
		const read = typeof type === "function" ? type : type.sync;

		const result = read({
			buffer: this.#buffer,
			offset: this.#offset,
			byteOrder: this.#byteOrder,
		});

		this.#offset += result.source.byteLength;

		switch (mode) {
			case ReadMode.Source:
				return result;
			case ReadMode.Value:
				return result.value;
		}

		throw new ReadError(`unknown read mode`, result.source);
	}

	#parseSearchItem(item: SyncSearchItem<Buffer>, backreferences: BinaryReader) {
		if (typeof item === "number") {
			const value = this.next(DataType.Uint8);
			return item === value;
		}

		if (typeof item === "string") {
			const validate = matchPattern(item);
			const value = this.next(DataType.Uint8);
			return validate(value, backreferences.#buffer);
		}

		const currentOffset = this.#offset;
		const result = item(this.next.bind(this), backreferences);

		if (!result) {
			this.#offset = currentOffset;
		}

		return result;
	}

	/**
	 * Search for a given sequence from current or given offset.
	 * Returns the offset where the found sequence starts or undefined.
	 * If a sequence is found, the read offset will point behind the sequence.
	 */
	find(sequence: readonly SyncSearchItem<Buffer>[], { offset = this.#offset, } = {}): number | undefined {
		const initialOffset = this.#offset;

		this.seek(offset);

		if (!this.hasNext()) {
			this.#offset = initialOffset;
			return;
		}

		for (const item of sequence) {
			const backreferences = new BinaryReader(this.#buffer.subarray(offset, this.#offset), this.#byteOrder);

			try {
				if (!this.#parseSearchItem(item, backreferences)) {
					throw new Error();
				}
			} catch (parseError) {
				if (parseError instanceof MatchError) {
					this.#offset = initialOffset;
					throw parseError;
				}

				try {
					const nextResult = this.find(sequence, { offset: offset + 1, });

					if (typeof nextResult === "undefined") {
						this.#offset = initialOffset;
					}

					return nextResult;
				} catch (error) {
					this.#offset = initialOffset;
					throw error;
				}
			}
		}

		return offset;
	}
}
