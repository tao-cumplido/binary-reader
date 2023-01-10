import type { Decoder } from './decoder.js';
import { DataType } from '../data/data-type.js';
import { ReadError } from '../read-error.js';

export const utf16: Decoder = (type, reader) => {
	const intType = DataType.int({ signed: false, byteLength: 2 }, type.byteOrder);

	const high = reader.next(intType).value;

	if (high < 0xd800 || high >= 0xe000) {
		return {
			value: String.fromCharCode(high),
			byteLength: 2,
		};
	}

	const low = reader.next(intType).value;

	if (high >= 0xdc00 || low < 0xdc00 || low >= 0xe000) {
		throw new ReadError(`invalid UTF-16 bytes`, type, reader.buffer.slice(reader.offset - 4, reader.offset));
	}

	return {
		value: String.fromCodePoint((high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000),
		byteLength: 4,
	};
};
