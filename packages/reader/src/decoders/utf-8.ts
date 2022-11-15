import type { Decoder } from './decoder';
import { DataType } from '../data/data-type.js';
import { ReadError } from '../read-error.js';

export const utf8: Decoder = (type, reader) => {
	const byte1 = reader.next(DataType.Uint8).value;

	if (byte1 < 0x80) {
		return {
			value: String.fromCharCode(byte1),
			byteLength: 1,
		};
	}

	const invalidMessage = 'invalid UTF-8 bytes';
	const incompleteMessage = 'incomplete UTF-8 bytes';

	if (byte1 < 0xc2 || byte1 > 0xf4) {
		throw new ReadError(invalidMessage, type, new Uint8Array([byte1]));
	}

	if (!reader.hasNext()) {
		throw new ReadError(incompleteMessage, type, new Uint8Array([byte1]));
	}

	const isInvalid = (...bytes: number[]) => bytes.some((byte) => byte < 0x80 || byte > 0xbf);

	const byte2 = reader.next(DataType.Uint8).value;

	if (byte1 < 0xe0) {
		if (isInvalid(byte2)) {
			throw new ReadError(invalidMessage, type, new Uint8Array([byte1, byte2]));
		}

		return {
			value: String.fromCodePoint(((byte1 & 0x1f) << 6) + (byte2 & 0x3f)),
			byteLength: 2,
		};
	}

	if (!reader.hasNext()) {
		throw new ReadError(incompleteMessage, type, new Uint8Array([byte1, byte2]));
	}

	const byte3 = reader.next(DataType.Uint8).value;

	if (byte1 < 0xf0) {
		if ((byte1 === 0xe0 && byte2 < 0xa0) || (byte1 === 0xed && byte2 > 0x9f) || isInvalid(byte2, byte3)) {
			throw new ReadError(invalidMessage, type, new Uint8Array([byte1, byte2, byte3]));
		}

		return {
			value: String.fromCodePoint(((byte1 & 0x0f) << 12) + ((byte2 & 0x3f) << 6) + (byte3 & 0x3f)),
			byteLength: 3,
		};
	}

	if (!reader.hasNext()) {
		throw new ReadError(incompleteMessage, type, new Uint8Array([byte1, byte2, byte3]));
	}

	const byte4 = reader.next(DataType.Uint8).value;

	if ((byte1 === 0xf0 && byte2 < 0x90) || (byte1 === 0xf4 && byte2 > 0x8f) || isInvalid(byte2, byte3, byte4)) {
		throw new ReadError(invalidMessage, type, new Uint8Array([byte1, byte2, byte3, byte4]));
	}

	return {
		value: String.fromCodePoint(((byte1 & 0x07) << 18) + ((byte2 & 0x3f) << 12) + ((byte3 & 0x3f) << 6) + (byte4 & 0x3f)),
		byteLength: 4,
	};
};
