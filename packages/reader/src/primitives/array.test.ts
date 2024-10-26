import assert from "node:assert/strict";
import test from "node:test";

import { ReadError } from "../read-error.js";
import { arrayReader, errorMessage } from "./array.js";
import { intReader } from "./int.js";

const uint8 = intReader({ signed: false, byteLength: 1, });

test.describe("array", () => {
	test("sync", () => {
		const buffer = new Uint8Array([ 0, 1, 2, 3, ]);
		const read = arrayReader(uint8, 2);

		assert.deepEqual(
			read.sync({ buffer, offset: 0, }),
			{ value: [ 0, 1, ], source: new Uint8Array([ 0, 1, ]), },
		);

		assert.deepEqual(
			read.sync({ buffer, offset: 2, }),
			{ value: [ 2, 3, ], source: new Uint8Array([ 2, 3, ]), },
		);
	});

	test("async with sync type", async () => {
		const buffer = new Uint8Array([ 0, 1, 2, 3, 4, 5, 6, 7, ]);

		let offset = 0;

		const advanceOffset = async (value: number) => {
			offset += value;
			return {
				buffer: buffer.subarray(offset, offset + 2),
				offset: 0,
			};
		};

		const read = arrayReader(uint8, 4);

		assert.deepEqual(
			await read.async({ buffer: buffer.subarray(0, 2), offset: 0, }, advanceOffset),
			{ value: [ 0, 1, 2, 3, ], source: new Uint8Array([ 0, 1, 2, 3, ]), },
		);

		assert.deepEqual(
			await read.async({ buffer: buffer.subarray(4, 6), offset: 0, }, advanceOffset),
			{ value: [ 4, 5, 6, 7, ], source: new Uint8Array([ 4, 5, 6, 7, ]), },
		);
	});

	test("async with async type", async () => {
		const buffer = new Uint8Array([ 0, 1, 2, 3, 4, 5, 6, 7, ]);

		let offset = 0;

		const advanceOffset = async (value: number) => {
			offset += value;
			return {
				buffer: buffer.subarray(offset, offset + 2),
				offset: 0,
			};
		};

		const read = arrayReader(arrayReader(uint8, 2), 2);

		assert.deepEqual(
			await read.async({ buffer: buffer.subarray(0, 2), offset: 0, }, advanceOffset),
			{ value: [ [ 0, 1, ], [ 2, 3, ], ], source: new Uint8Array([ 0, 1, 2, 3, ]), },
		);

		assert.deepEqual(
			await read.async({ buffer: buffer.subarray(4, 6), offset: 0, }, advanceOffset),
			{ value: [ [ 4, 5, ], [ 6, 7, ], ], source: new Uint8Array([ 4, 5, 6, 7, ]), },
		);
	});

	test("errors", async () => {
		assert.throws(
			() => {
				const read = arrayReader({ async: async () => Promise.resolve({ value: 0, source: new Uint8Array(), }), }, 1);
				read.sync({ buffer: new Uint8Array(), offset: 0, });
			},
			new ReadError(errorMessage.missingSyncRead()),
		);

		await assert.rejects(
			async () => {
				// @ts-expect-error
				const read = arrayReader({}, 1);
				const state = { buffer: new Uint8Array(), offset: 0, };
				await read.async(state, async () => Promise.resolve(state));
			},
			new ReadError(errorMessage.missingAsyncRead()),
		);
	});
});


