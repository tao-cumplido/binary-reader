import assert from "node:assert/strict";
import test from "node:test";

import { AsyncReader, type UpdateBuffer } from "./async-reader.js";
import { ByteOrder } from "./byte-order.js";
import { DataType } from "./data-type.js";
import { Encoding } from "./encoding.js";
import { MatchError } from "./pattern/match.js";
import { ReadMode } from "./read-mode.js";

const updateBuffer = (buffer: Uint8Array): UpdateBuffer<Uint8Array> => async ({ offset, size, }) => {
	return Promise.resolve(buffer.subarray(offset, offset + size));
};

test.describe("AsyncReader", () => {
	test("seek", async () => {
		const sourceBuffer = new Uint8Array([ 0, 1, 2, 3, 4, ]);

		const reader = new AsyncReader(sourceBuffer.byteLength, updateBuffer(sourceBuffer), { bufferSize: 2, });

		await reader.seek(3);

		assert.equal(reader.offset, 3);
		assert.equal(reader.bufferStart, 3);
		assert.deepEqual(await reader.getBuffer(), sourceBuffer.subarray(3, 5));

		await reader.seek(4);

		assert.equal(reader.offset, 4);
		assert.equal(reader.bufferStart, 3);
		assert.deepEqual(await reader.getBuffer(), sourceBuffer.subarray(3, 5));

		assert.deepEqual(await reader.next(DataType.Uint8, ReadMode.Source), {
			value: 4,
			source: sourceBuffer.subarray(4, 5),
		});

		assert.equal(reader.offset, 5);
		assert.equal(reader.bufferStart, 5);
		assert.deepEqual(await reader.getBuffer(), sourceBuffer.subarray(5));

		await reader.seek(2);

		assert.equal(reader.offset, 2);
		assert.equal(reader.bufferStart, 2);
		assert.deepEqual(await reader.getBuffer(), sourceBuffer.subarray(2, 4));

		await reader.seek(4);

		assert.equal(reader.offset, 4);
		assert.equal(reader.bufferStart, 4);
		assert.deepEqual(await reader.getBuffer(), sourceBuffer.subarray(4, 5));

		await reader.seek(0);

		assert.equal(reader.offset, 0);
		assert.equal(reader.bufferStart, 0);
		assert.deepEqual(await reader.getBuffer(), sourceBuffer.subarray(0, 2));

		await reader.seek(5);

		assert.equal(reader.offset, 5);
		assert.equal(reader.bufferStart, 5);
		assert.deepEqual(await reader.getBuffer(), sourceBuffer.subarray(5));

		await assert.rejects(reader.seek(6));
	});

	test("next", async () => {
		const sourceBuffer = new Uint8Array([ 0x30, 0x31, 0x32, 0x33, 0x00, 0xe3, ]);

		const reader = new AsyncReader(sourceBuffer.byteLength, updateBuffer(sourceBuffer), ByteOrder.BigEndian, {
			bufferSize: 2,
		});

		assert.deepEqual(await reader.next(DataType.array(DataType.Uint8, 4), ReadMode.Source), {
			value: [ 0x30, 0x31, 0x32, 0x33, ],
			source: sourceBuffer.subarray(0, 4),
		});

		assert.equal(reader.offset, 4);
		assert.deepEqual(await reader.getBuffer(), sourceBuffer.subarray(4, 6));

		await reader.seek(0);

		assert.deepEqual(await reader.next(DataType.string(Encoding.ASCII), ReadMode.Source), {
			value: "0123",
			source: sourceBuffer.subarray(0, 5),
		});

		assert.equal(reader.offset, 5);
		assert.deepEqual(await reader.getBuffer(), sourceBuffer.subarray(4, 6));

		await reader.seek(0);

		assert.deepEqual(
			await reader.next(
				{
					async: async ({ buffer, offset, byteOrder, }, advanceOffset) => {
						const string = await DataType.string(Encoding.ASCII, { count: 2, }).async({ buffer, offset, }, advanceOffset);
						({ buffer, offset, } = await advanceOffset(0));

						const uint16 = DataType.Uint16.sync({ buffer, offset, byteOrder, });
						await advanceOffset(2);

						const source = new Uint8Array(string.source.byteLength + uint16.source.byteLength);

						source.set(string.source, 0);
						source.set(uint16.source, string.source.byteLength);

						return {
							value: [ string.value, uint16.value, ],
							source,
						};
					},
				},
				ReadMode.Source,
			),
			{
				value: [ "01", 0x3233, ],
				source: sourceBuffer.subarray(0, 4),
			},
		);

		assert.equal(reader.offset, 4);

		await reader.skip(1);

		assert.equal(reader.offset, 5);

		await assert.rejects(reader.next(DataType.char(Encoding.UTF8)));

		assert.equal(reader.offset, 5);

		assert.deepEqual(await reader.next(DataType.Uint8, ReadMode.Source), {
			value: 0xe3,
			source: sourceBuffer.subarray(5, 6),
		});

		assert.equal(reader.offset, 6);
	});

	test.describe("find", () => {
		test("empty source", async () => {
			const reader = new AsyncReader(0, updateBuffer(new Uint8Array()), { bufferSize: 2, });
			assert.equal(await reader.find([ 0, ]), undefined);
			assert.equal(reader.offset, 0);
		});

		test("numbers", async () => {
			const source = new Uint8Array([ 0x00, 0x01, 0x02, 0x03, 0x01, 0x02, ]);
			const reader = new AsyncReader(source.byteLength, updateBuffer(source), { bufferSize: 2, });

			assert.equal(await reader.find([ 0x01, 0x02, ]), 1);
			assert.equal(reader.offset, 3);

			assert.equal(await reader.find([ 0x05, ]), undefined);
			assert.equal(reader.offset, 3);

			assert.equal(await reader.find([ 0x01, 0x02, ]), 4);
			assert.equal(reader.offset, 6);
		});

		test("patterns", async () => {
			const source = new Uint8Array([ 0x00, 0x01, 0x02, 0x03, 0x01, 0x02, ]);
			const reader = new AsyncReader(source.byteLength, updateBuffer(source), { bufferSize: 2, });

			assert.equal(await reader.find([ "0?", "??", "02", ]), 0);
			assert.equal(reader.offset, 3);

			assert.equal(await reader.find([ "0?", "??", "02", ]), 3);
			assert.equal(reader.offset, 6);

			assert.equal(await reader.find([ "??", "$0+1", ], { offset: 0, }), 0);
			assert.equal(reader.offset, 2);

			assert.equal(await reader.find([ "??", "$0+1", ]), 2);
			assert.equal(reader.offset, 4);

			assert.equal(await reader.find([ "??", "$0+1", ], { offset: 3, }), 4);
			assert.equal(reader.offset, 6);
		});

		test("data types", async () => {
			const source = new Uint8Array([ 0x20, 0x00, 0x00, 0x30, ]);
			const reader = new AsyncReader(source.byteLength, updateBuffer(source), ByteOrder.BigEndian, { bufferSize: 2, });

			assert.equal(await reader.find([ async (read) => {
				const value = await read(DataType.Uint16);
				return value === 0x2000;
			}, ]), 0);
			assert.equal(reader.offset, 2);

			assert.equal(await reader.find([ async (read) => {
				const value = await read(DataType.Uint16);
				return value === 0x2000;
			}, ]), undefined);
			assert.equal(reader.offset, 2);

			assert.equal(await reader.find([ async (read) => {
				const value = await read(DataType.Uint16);
				return value === 0x30;
			}, ]), 2);
			assert.equal(reader.offset, 4);
		});

		test("data types with backreference", async () => {
			const source = new Uint8Array([ 0x00, 0x01, ]);
			const reader = new AsyncReader(source.byteLength, updateBuffer(source), { bufferSize: 2, });

			const result = await reader.find([
				async (read) => {
					const value = await read(DataType.Uint8);
					return value === 0x00;
				},
				async (read, backreferences) => {
					const reference = backreferences.next(DataType.Uint8);
					const value = await read(DataType.Uint8);
					return value === reference + 1;
				},
			]);

			assert.equal(result, 0);
			assert.equal(reader.offset, 2);
		});

		test("aborted signal", async () => {
			const reader = new AsyncReader(0, updateBuffer(new Uint8Array()), { bufferSize: 2, });

			await assert.rejects(reader.find([], { signal: AbortSignal.abort(), }), (error) => {
				assert(error instanceof Error);
				assert.equal(error.name, "AbortError");
				return true;
			});
		});

		test("timeout", { timeout: 1000, }, async () => {
			const source = new Uint8Array([ 0, ]);
			const reader = new AsyncReader(Infinity, async () => source.subarray(0, 1), { bufferSize: 1, });

			await assert.rejects(reader.find([ 1, ], { signal: AbortSignal.timeout(0), }), (error) => {
				assert(error instanceof Error);
				assert.equal(error.name, "TimeoutError");
				return true;
			});

			assert.equal(reader.offset, 0);
		});

		test("invalid pattern", () => {
			const source = new Uint8Array([ 0x00, 0x01, 0x02, ]);
			const reader = new AsyncReader(source.length, updateBuffer(source), { bufferSize: 1, });

			assert.rejects(reader.find([ 0x01, "xx", ]), (error) => error instanceof MatchError);
			assert.equal(reader.offset, 0);
		});

		test("overshoot", async () => {
			const source = new Uint8Array([ 0x00, 0x01, ]);
			const reader = new AsyncReader(source.length, updateBuffer(source), { bufferSize: 1, });

			assert.equal(await reader.find([ 0x01, 0x02, ]), undefined);
			assert.equal(reader.offset, 0);
		});
	});
});


