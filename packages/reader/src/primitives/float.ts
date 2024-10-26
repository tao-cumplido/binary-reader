import { assertInt } from "../assert.js";
import { ByteOrder } from "../byte-order.js";
import { ReadError } from "../read-error.js";
import type { DataReader } from "../types.js";

export type FloatBytes = 4 | 8;

export interface FloatReaderInit {
	readonly byteLength: FloatBytes;
}

export type FloatReaderFactory = (init: FloatReaderInit, byteOrder?: ByteOrder) => DataReader<number>;

export const errorMessage = {
	noByteOrder: () => `cannot read float value with unspecified byte order`,
} as const;

export const floatReader: FloatReaderFactory = ({ byteLength, }, initByteOrder?: ByteOrder) => {
	assertInt(byteLength, { values: [ 4, 8, ], });

	const reader: DataReader<number> = (state) => {
		const { buffer, offset, } = state;
		const byteOrder = initByteOrder ?? state.byteOrder;
		const source = buffer.subarray(offset, offset + byteLength);

		if (!byteOrder) {
			throw new ReadError(errorMessage.noByteOrder(), source);
		}

		const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

		const method = byteLength === 4 ? view.getFloat32 : view.getFloat64;
		const value = method.call(view, offset, byteOrder === ByteOrder.LittleEndian);

		return {
			value,
			source,
		};
	};

	reader.maxRequiredBytes = byteLength;

	return reader;
};
