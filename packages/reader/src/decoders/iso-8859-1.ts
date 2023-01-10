import type { Decoder } from './decoder.js';
import { DataType } from '../data/data-type.js';
import { ReadError } from '../read-error.js';

export const iso88591: Decoder = (type, reader) => {
	const { value } = reader.next(DataType.Uint8);

	if (value < 0x20 || (value >= 0x7f && value < 0xa0)) {
		throw new ReadError('invalid ISO 8859-1 bytes', type, new Uint8Array([value]));
	}

	return {
		value: String.fromCharCode(value),
		byteLength: 1,
	};
};
