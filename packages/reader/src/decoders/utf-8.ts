import { intReader } from "../primitives/int.js";
import { ReadError } from "../read-error.js";
import type { Decoder } from "../types.js";

const uint8 = intReader({ signed: false, byteLength: 1, });

export const utf8: Decoder = {
	decode: ({ buffer, offset, }) => {
		const { value: byte1, } = uint8({ buffer, offset: offset++, });

		let source = new Uint8Array([ byte1, ]);

		if (byte1 < 0x80) {
			return {
				value: String.fromCharCode(byte1),
				source,
			};
		}

		const invalidMessage = "invalid UTF-8 bytes";
		const incompleteMessage = "incomplete UTF-8 bytes";

		if (byte1 < 0xc2 || byte1 > 0xf4) {
			throw new ReadError(invalidMessage, source);
		}

		if (offset >= buffer.length) {
			throw new ReadError(incompleteMessage, source);
		}

		const isInvalid = (...bytes: number[]) => bytes.some((byte) => byte < 0x80 || byte > 0xbf);

		const { value: byte2, } = uint8({ buffer, offset: offset++, });

		source = new Uint8Array([ byte1, byte2, ]);

		if (byte1 < 0xe0) {
			if (isInvalid(byte2)) {
				throw new ReadError(invalidMessage, source);
			}

			return {
				value: String.fromCodePoint(((byte1 & 0x1f) << 6) + (byte2 & 0x3f)),
				source,
			};
		}

		if (offset >= buffer.length) {
			throw new ReadError(incompleteMessage, source);
		}

		const { value: byte3, } = uint8({ buffer, offset: offset++, });

		source = new Uint8Array([ byte1, byte2, byte3, ]);

		if (byte1 < 0xf0) {
			if ((byte1 === 0xe0 && byte2 < 0xa0) || (byte1 === 0xed && byte2 > 0x9f) || isInvalid(byte2, byte3)) {
				throw new ReadError(invalidMessage, source);
			}

			return {
				value: String.fromCodePoint(((byte1 & 0x0f) << 12) + ((byte2 & 0x3f) << 6) + (byte3 & 0x3f)),
				source,
			};
		}

		if (offset >= buffer.length) {
			throw new ReadError(incompleteMessage, source);
		}

		const { value: byte4, } = uint8({ buffer, offset: offset++, });

		source = new Uint8Array([ byte1, byte2, byte3, byte4, ]);

		if ((byte1 === 0xf0 && byte2 < 0x90) || (byte1 === 0xf4 && byte2 > 0x8f) || isInvalid(byte2, byte3, byte4)) {
			throw new ReadError(invalidMessage, source);
		}

		return {
			value: String.fromCodePoint(
				((byte1 & 0x07) << 18) + ((byte2 & 0x3f) << 12) + ((byte3 & 0x3f) << 6) + (byte4 & 0x3f),
			),
			source,
		};
	},
	maxRequiredBytes: 4,
};
