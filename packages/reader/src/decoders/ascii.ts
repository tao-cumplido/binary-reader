import type { BinaryReader, DataValue } from '../binary-reader';
import type { DataChar } from '../data';
import { DataType } from '../data/data-type.js';
import { ReadError } from '../read-error.js';

export default (type: DataChar, reader: BinaryReader): DataValue<string> => {
	const { value } = reader.next(DataType.Uint8);

	if (value >= 0x80) {
		throw new ReadError('invalid ASCII bytes', type, new Uint8Array([value]));
	}

	return {
		value: String.fromCharCode(value),
		byteLength: 1,
	};
};
