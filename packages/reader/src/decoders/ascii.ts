import type { Decoder } from './decoder';
import { DataType } from '../data/data-type.js';
import { ReadError } from '../read-error.js';

export const ascii: Decoder = (type, reader) => {
	const { value } = reader.next(DataType.Uint8);

	if (value >= 0x80) {
		throw new ReadError('invalid ASCII bytes', type, new Uint8Array([value]));
	}

	return {
		value: String.fromCharCode(value),
		byteLength: 1,
	};
};
