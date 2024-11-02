import { intReader } from "../primitives/int.js";
import { ReadError } from "../read-error.js";
import type { Decoder } from "../types.js";

const uint8 = intReader({ signed: false, byteLength: 1, });

export const iso88591: Decoder = {
	minBytes: 1,
	maxBytes: 1,
	decode: ({ buffer, offset, }) => {
		const { value, source, } = uint8({ buffer, offset, });

		if (value < 0x20 || (value >= 0x7f && value < 0xa0)) {
			throw new ReadError("invalid ISO 8859-1 bytes", new Uint8Array([ value, ]));
		}

		return {
			value: String.fromCharCode(value),
			source,
		};
	},
};
