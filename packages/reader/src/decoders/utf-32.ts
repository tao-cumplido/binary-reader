import type { Decoder } from './decoder.js';
import { DataType } from '../data/data-type.js';
import { ReadError } from '../read-error.js';

export const utf32: Decoder = (type, reader) => {
	const codePoint = reader.next(DataType.int({ signed: false, byteLength: 4 }, type.byteOrder)).value;

	if ((codePoint >= 0xd800 && codePoint < 0xe000) || codePoint > 0x10ffff) {
		throw new ReadError(`invalid UTF-32 code point`, type, reader.buffer.slice(reader.offset - 4, reader.offset));
	}

	return {
		value: String.fromCodePoint(codePoint),
		byteLength: 4,
	};
};
