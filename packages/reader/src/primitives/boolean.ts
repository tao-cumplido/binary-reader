import type { DataReader } from "../types.js";
import { bigintReader } from "./bigint.js";

export type BooleanReaderFactory = () => DataReader<boolean>;

export const booleanReader: BooleanReaderFactory = () => {
	const uint8 = bigintReader({ signed: false, byteLength: 1, });

	const reader: DataReader<boolean> = (state) => {
		const { value, source, } = uint8(state);

		return {
			value: Boolean(value),
			source,
		};
	};

	reader.maxRequiredBytes = 1;

	return reader;
};
