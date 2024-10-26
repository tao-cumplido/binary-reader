import { intReader } from "../primitives/int.js";
import { ReadError } from "../read-error.js";
import type { Decoder } from "../types.js";

const uint32 = intReader({ signed: false, byteLength: 4, });

export const utf32: Decoder = {
	decode: ({ buffer, offset, byteOrder, }) => {
		const { value, source, } = uint32({ buffer, offset, byteOrder, });

		if ((value >= 0xd800 && value < 0xe000) || value > 0x10ffff) {
			throw new ReadError(`invalid UTF-32 code point`, source);
		}

		return {
			value: String.fromCodePoint(value),
			source,
		};
	},
	maxRequiredBytes: 4,
};
