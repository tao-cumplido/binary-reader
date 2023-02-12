import type { ByteOrder } from '../byte-order.js';
import type { DataReader, Decoder } from '../types.js';

export type CharReaderFactory = (decoder: Decoder, byteOrder?: ByteOrder) => DataReader<string>;

export const charReader: CharReaderFactory = (decoder, initByteOrder) => {
	const reader: DataReader<string> = (state) => {
		const { buffer, offset } = state;
		const byteOrder = initByteOrder ?? state.byteOrder;
		return decoder.decode({ buffer, offset, byteOrder });
	};

	reader.maxRequiredBytes = decoder.maxRequiredBytes;

	return reader;
};
