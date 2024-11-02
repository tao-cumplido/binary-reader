import { intReader } from "../primitives/int.js";
import { ReadError } from "../read-error.js";
import type { Decoder } from "../types.js";

const uint16 = intReader({ signed: false, byteLength: 2, });

export const utf16: Decoder = {
	minBytes: 2,
	maxBytes: 4,
	decode: ({ buffer, offset, byteOrder, }) => {
		const high = uint16({ buffer, offset, byteOrder, });

		if (high.value < 0xd800 || high.value >= 0xe000) {
			return {
				value: String.fromCharCode(high.value),
				source: high.source,
			};
		}

		const low = uint16({ buffer, offset: offset + 2, byteOrder, });

		const source = new Uint8Array(high.source.byteLength + low.source.byteLength);

		source.set(high.source, 0);
		source.set(low.source, high.source.byteLength);

		if (high.value >= 0xdc00 || low.value < 0xdc00 || low.value >= 0xe000) {
			throw new ReadError(`invalid UTF-16 bytes`, source);
		}

		return {
			value: String.fromCodePoint((high.value - 0xd800) * 0x400 + (low.value - 0xdc00) + 0x10000),
			source,
		};
	},
};
