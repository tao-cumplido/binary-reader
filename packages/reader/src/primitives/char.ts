import type { ByteOrder } from '../byte-order.js';
import type { Encoding } from '../encoding.js';
import type { DataReader } from '../types.js';

export type CharReaderFactory = (encoding: Encoding, byteOrder?: ByteOrder) => DataReader<string>;

export const charReader: CharReaderFactory = (encoding, initByteOrder) => {
	const reader: DataReader<string> = (state) => {
		const { buffer, offset } = state;
		const byteOrder = initByteOrder ?? state.byteOrder;

		return encoding.decode({ buffer, offset, byteOrder });
	};

	reader.maxRequiredBytes = encoding.maxBytes;

	return reader;
};
