import type { DataReader } from '../types.js';
import { assertInt } from '../assert.js';
import { ByteOrder } from '../byte-order.js';
import { ReadError } from '../read-error.js';

export interface BigIntReaderInit {
	readonly signed: boolean;
	readonly byteLength: number;
}

export type BigIntReaderFactory = (init: BigIntReaderInit, byteOrder?: ByteOrder) => DataReader<bigint>;

export const errorMessage = {
	noByteOrder: () => `cannot read multibyte integer with unspecified byte order`,
	unexpectedBufferEnd: (byteLength: number, offset: number) => `couldn't read ${byteLength} bytes from offset ${offset}`,
} as const;

export const bigintReader: BigIntReaderFactory = ({ signed, byteLength }, initByteOrder?) => {
	assertInt(byteLength, { min: 1 });

	const reader: DataReader<bigint> = (state) => {
		const { buffer, offset } = state;
		const byteOrder = initByteOrder ?? state.byteOrder;

		const byteList = buffer.subarray(offset, offset + byteLength);

		if (byteLength > 1 && !byteOrder) {
			throw new ReadError(errorMessage.noByteOrder(), byteList);
		}

		if (byteList.length !== byteLength) {
			throw new ReadError(errorMessage.unexpectedBufferEnd(byteLength, offset), byteList);
		}

		const sum = (resolve: (index: number) => number) => (result: bigint, byte: number, index: number) => {
			return result + (BigInt(byte) << BigInt(resolve(index) * 8));
		};

		const uint =
			byteOrder === ByteOrder.BigEndian
				? byteList.reduceRight(
						sum((index) => byteList.length - (index + 1)),
						0n,
				  )
				: byteList.reduce(
						sum((index) => index),
						0n,
				  );

		const value = signed ? BigInt.asIntN(byteLength * 8, uint) : uint;

		return {
			value,
			source: byteList,
		};
	};

	reader.maxRequiredBytes = byteLength;

	return reader;
};
