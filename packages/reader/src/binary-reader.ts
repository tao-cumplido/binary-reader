import { assertInt } from './assert.js';
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
import { ReadError } from './read-error.js';
import { repeat } from './repeat.js';

type ReadWrite<T> = {
	-readonly [P in keyof T]: T[P];
};

export type Struct = DataType[] | Record<string, DataType>;

export interface DataValue<T> {
	readonly value: T;
	readonly byteLength: number;
}

export type Read<T extends DataType | Struct> = T extends Struct
	? { [P in keyof T]: T[P] extends infer D ? (D extends DataType ? Read<D> : T[P]) : T[P] }
	: T extends DataArray<infer D>
	? DataValue<Array<Read<D>['value']>>
	: T extends DataInt | DataFloat
	? DataValue<number>
	: T extends DataBigInt
	? DataValue<bigint>
	: T extends DataChar | DataString
	? DataValue<string>
	: DataValue<boolean>;

export class BinaryReader {
	#offset = 0;

	#buffer: Uint8Array;
	#view: DataView;
	#byteOrder?: ByteOrder;

	get offset(): number {
		return this.#offset;
	}

	get buffer(): Uint8Array {
		return this.#buffer;
	}

	get byteOrder(): ByteOrder | undefined {
		return this.#byteOrder;
	}

	constructor(source: Uint8Array, byteOrder?: ByteOrder) {
		this.#buffer = source;
		this.#view = new DataView(source.buffer, source.byteOffset, source.byteLength);
		this.#byteOrder = byteOrder;
	}

	setByteOrder(byteOrder: ByteOrder): void {
		this.#byteOrder = byteOrder;
	}

	/**
	 * Reads the byte order mark from the given offset and sets the byte order on the reader instance.
	 * Advances the read offset by 2 bytes on succes, throws an error otherwise.
	 */
	readByteOrderMark(offset = this.#offset): void {
		this.seek(offset);

		const byteOrder = ByteOrder.lookupValue(
			this.next(DataType.int({ signed: false, byteLength: 2 }, ByteOrder.BigEndian)).value,
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

		if (typeof magic === 'string') {
			const { value } = this.next(DataType.string(Encoding.ASCII, { count: magic.length }));
			if (magic !== value) {
				throw new TypeError(`invalid magic: expected '${magic}', got '${value}`);
			}
		} else {
			const { value } = this.next(DataType.array(DataType.Uint8, magic.length));

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

	/**
	 * Creates copy of the reader from the current read offset with the given size.
	 */
	slice(size: number): BinaryReader {
		this.skip(size);
		const reader = new BinaryReader(this.#buffer.slice(this.#offset - size, this.#offset), this.#byteOrder);
		return reader;
	}

	/**
	 * Set the read offset.
	 */
	seek(offset: number): void {
		assertInt(offset, { min: 0, max: this.#buffer.length - 1 });
		this.#offset = offset;
	}

	/**
	 * Advance the read offset by number of bytes given.
	 */
	skip(bytes: number): void {
		assertInt(bytes, { min: 0 });
		this.seek(this.#offset + bytes);
	}

	/**
	 * Align the read offset to the nearest multiple.
	 */
	align(to: number): void {
		assertInt(to, { min: 0 });
		this.skip(((-this.#offset % to) + to) % to);
	}

	/**
	 * Read the next value of the given type and advance the read offset by numbers of bytes processed.
	 */
	next<T extends DataType | Struct>(type: T): Read<T> {
		/* eslint-disable @typescript-eslint/consistent-type-assertions */

		const initialOffset = this.#offset;

		try {
			if (type instanceof DataBoolean) {
				return {
					value: Boolean(this.next(DataType.Uint8).value),
					byteLength: 1,
				} as DataValue<boolean> as Read<T>;
			}

			if (type instanceof DataInt || type instanceof DataBigInt) {
				const { byteLength, signed, byteOrder = this.#byteOrder } = type;

				if (byteLength > 1 && !byteOrder) {
					throw new ReadError(`no byte order specified for reading multibyte integer`, type);
				}

				const byteList = this.#buffer.slice(this.#offset, this.#offset + byteLength);

				if (byteList.length !== byteLength) {
					throw new ReadError(`couldn't read ${byteLength} bytes from offset ${this.#offset}`, type, byteList);
				}

				if (byteOrder === ByteOrder.BigEndian) {
					byteList.reverse();
				}

				const uint = byteList.reduce((result, byte, index) => result + (BigInt(byte) << BigInt(index * 8)), 0n);

				const value = signed ? BigInt.asIntN(byteLength * 8, uint) : uint;

				this.#offset += byteLength;

				return {
					value: type instanceof DataInt ? Number(value) : value,
					byteLength,
				} as DataValue<number> as Read<T>;
			}

			if (type instanceof DataFloat) {
				const { byteLength, byteOrder = this.#byteOrder } = type;

				if (!byteOrder) {
					throw new ReadError(`no byte order specified for reading float value`, type);
				}

				const method = byteLength === 4 ? this.#view.getFloat32 : this.#view.getFloat64;
				const value = method.call(this.#view, this.#offset, byteOrder === ByteOrder.LittleEndian);

				this.#offset += byteLength;

				return {
					value,
					byteLength,
				} as DataValue<number> as Read<T>;
			}

			if (type instanceof DataChar) {
				const { encoding, byteOrder = this.#byteOrder } = type;

				if (encoding === Encoding.ASCII) {
					return {
						value: String.fromCharCode(this.next(DataType.Uint8).value),
						byteLength: 1,
					} as DataValue<string> as Read<T>;
				}

				if (encoding === Encoding.UTF8) {
					const byte1 = this.next(DataType.Uint8).value;

					if (byte1 < 0x80) {
						return {
							value: String.fromCharCode(byte1),
							byteLength: 1,
						} as DataValue<string> as Read<T>;
					}

					const message = 'invalid utf-8 bytes';

					if (byte1 < 0xc2 || byte1 > 0xf4) {
						throw new ReadError(message, type, new Uint8Array([byte1]));
					}

					const isInvalid = (...bytes: number[]) => bytes.some((byte) => byte < 0x80 || byte > 0xbf);

					const byte2 = this.next(DataType.Uint8).value;

					if (byte1 < 0xe0) {
						if (isInvalid(byte2)) {
							throw new ReadError(message, type, new Uint8Array([byte1, byte2]));
						}

						return {
							value: String.fromCodePoint(((byte1 & 0x1f) << 6) + (byte2 & 0x3f)),
							byteLength: 2,
						} as DataValue<string> as Read<T>;
					}

					const byte3 = this.next(DataType.Uint8).value;

					if (byte1 < 0xf0) {
						if ((byte1 === 0xe0 && byte2 < 0xa0) || (byte1 === 0xed && byte2 > 0x9f) || isInvalid(byte2, byte3)) {
							throw new ReadError(message, type, new Uint8Array([byte1, byte2, byte3]));
						}

						return {
							value: String.fromCodePoint(((byte1 & 0x0f) << 12) + ((byte2 & 0x3f) << 6) + (byte3 & 0x3f)),
							byteLength: 3,
						} as DataValue<string> as Read<T>;
					}

					const byte4 = this.next(DataType.Uint8).value;

					if ((byte1 === 0xf0 && byte2 < 0x90) || (byte1 === 0xf4 && byte2 > 0x8f) || isInvalid(byte2, byte3, byte4)) {
						throw new ReadError(message, type, new Uint8Array([byte1, byte2, byte3, byte4]));
					}

					return {
						value: String.fromCodePoint(
							((byte1 & 0x07) << 18) + ((byte2 & 0x3f) << 12) + ((byte3 & 0x3f) << 6) + (byte4 & 0x3f),
						),
						byteLength: 4,
					} as DataValue<string> as Read<T>;
				}

				if (encoding === Encoding.UTF16) {
					const char: DataValue<string> = (() => {
						const high = this.next(DataType.int({ signed: false, byteLength: 2 }, byteOrder)).value;

						if (high < 0xd800 || high >= 0xe000) {
							return {
								value: String.fromCharCode(high),
								byteLength: 2,
							};
						}

						const low = this.next(DataType.int({ signed: false, byteLength: 2 }, byteOrder)).value;

						if (high >= 0xdc00 || low < 0xdc00 || low >= 0xe000) {
							throw new ReadError(`invalid utf-16 bytes`, type, this.#buffer.slice(this.#offset - 4, this.#offset));
						}

						return {
							value: String.fromCodePoint((high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000),
							byteLength: 4,
						};
					})();

					return char as Read<T>;
				}

				if (encoding === Encoding.UTF32) {
					const codePoint = this.next(DataType.int({ signed: false, byteLength: 4 }, byteOrder)).value;

					if (codePoint >= 0xd800 && codePoint < 0xe000) {
						throw new ReadError(`invalid utf-32 code point`, type, this.#buffer.slice(this.#offset - 4, this.#offset));
					}

					return {
						value: String.fromCodePoint(codePoint),
						byteLength: 4,
					} as DataValue<string> as Read<T>;
				}

				throw new TypeError(`unsuported encoding`);
			}

			if (type instanceof DataString) {
				const { encoding, byteOrder, terminator, count } = type;

				const charType = DataType.char(encoding, byteOrder);

				if (count > 0) {
					const { value, byteLength } = this.next(DataType.array(charType, count));
					return {
						value: value.join(''),
						byteLength,
					} as Read<T>;
				}

				const result: ReadWrite<DataValue<string>> = {
					value: '',
					byteLength: 0,
				};

				let char = this.next(charType);

				while (char.value !== terminator && this.#offset < this.#buffer.length) {
					result.value += char.value;
					result.byteLength += char.byteLength;
					char = this.next(charType);
				}

				if (char.value !== terminator) {
					result.value += char.value;
				}

				result.byteLength += char.byteLength;

				return result as Read<T>;
			}

			if (type instanceof DataArray) {
				return repeat(type.count, () => this.next(type.type) as DataValue<unknown>).reduce<ReadWrite<DataValue<unknown[]>>>(
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
				if (type.some((item) => !(item instanceof DataType))) {
					throw new TypeError(`struct array contains items which are not an instance of DataType`);
				}

				return type.map((itemType) => this.next(itemType)) as Read<T>;
			}

			if (Object.values(type).some((item) => !(item instanceof DataType))) {
				throw new TypeError(`struct object contains items which are not an instance of DataType`);
			}

			return Object.fromEntries(Object.entries(type).map(([key, itemType]) => [key, this.next(itemType)])) as Read<T>;
		} catch (error) {
			this.#offset = initialOffset;
			throw error;
		}

		/* eslint-enable @typescript-eslint/consistent-type-assertions */
	}
}
