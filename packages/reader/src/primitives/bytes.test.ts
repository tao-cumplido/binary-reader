import assert from "node:assert/strict";
import test from "node:test";

import { bytesReader } from "./bytes.js";

test.describe("bytes", () => {
	test.todo("sync");

	test("async", async () => {
		const buffer = new Uint8Array([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ]);

		let offset = 0;

		const advanceOffset = async (value: number) => {
			offset += value;
			return {
				buffer: buffer.subarray(offset, offset + 2),
				offset: 0,
			};
		};

		const read = bytesReader(7);

		assert.deepEqual(
			await read.async({ buffer: buffer.subarray(0, 2), offset: 0, }, advanceOffset),
			{ value: buffer.subarray(0, 7), source: buffer.subarray(0, 7), },
		);
	});
});


