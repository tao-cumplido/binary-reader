import { assertInt } from "../assert.js";
import type { InternalDataReader } from "../types.js";

export type BytesReaderFactory = (count: number) => InternalDataReader<Uint8Array>;

export const bytesReader: BytesReaderFactory = (count) => {
	assertInt(count, { min: 0, });

	return {
		sync: ({ buffer, offset, }) => {
			const value = buffer.subarray(offset, offset + count);
			return {
				value,
				source: value,
			};
		},
		async: async ({ buffer, offset, }, advanceOffset) => {
			if (offset + count <= buffer.byteLength) {
				const value = buffer.subarray(offset, offset + count);
				return {
					value,
					source: value,
				};
			}

			const value = new Uint8Array(count);

			let n = 0;

			while (n < count) {
				const part = buffer.subarray(offset, Math.min(buffer.byteLength, offset + count - n));
				value.set(part, n);
				n += part.byteLength;
				({ buffer, offset, } = await advanceOffset(part.byteLength));
			}

			return {
				value,
				source: value,
			};
		},
	};
};
