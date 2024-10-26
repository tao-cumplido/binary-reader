import { assertInt } from "../assert.js";
import type { ByteOrder } from "../byte-order.js";
import type { DataReader } from "../types.js";
import { bigintReader } from "./bigint.js";

export type SafeIntBytes = 1 | 2 | 3 | 4 | 5 | 6;

export interface IntReaderInit {
	readonly signed: boolean;
	readonly byteLength: SafeIntBytes;
}

export type IntReaderFactory = (init: IntReaderInit, byteOrder?: ByteOrder) => DataReader<number>;

export const intReader: IntReaderFactory = ({ signed, byteLength, }, byteOrder) => {
	assertInt(byteLength, { min: 1, max: 6, });

	const bigint = bigintReader({ signed, byteLength, }, byteOrder);

	const reader: DataReader<number> = (state) => {
		const { value, source, } = bigint(state);

		return {
			value: Number(value),
			source,
		};
	};

	reader.maxRequiredBytes = byteLength;

	return reader;
};
