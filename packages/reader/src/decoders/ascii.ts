import type { Decoder } from '../types.js';
import { intReader } from '../primitives/int.js';
import { ReadError } from '../read-error.js';

const uint8 = intReader({ signed: false, byteLength: 1 });

export const ascii: Decoder = {
	decode: ({ buffer, offset }) => {
		const { value, source } = uint8({ buffer, offset });

		if (value >= 0x80) {
			throw new ReadError('invalid ASCII bytes', new Uint8Array([value]));
		}

		return {
			value: String.fromCharCode(value),
			source,
		};
	},
	maxRequiredBytes: 1,
};
