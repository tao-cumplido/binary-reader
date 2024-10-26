import assert from "node:assert/strict";
import test from "node:test";

import { ByteOrder } from "../byte-order.js";
import { Encoding } from "../encoding.js";
import { stringReader } from "./string.js";

test.describe("string", () => {
	test("sync", () => {
		const buffer = new Uint8Array([ 0x31, 0x32, 0x33, 0x00, 0x61, 0x62, 0x63, ]);

		const readDefault = stringReader(Encoding.ASCII);

		assert.deepEqual(readDefault.sync({ buffer, offset: 0, }), {
			value: "123",
			source: buffer.subarray(0, 4),
		});

		assert.deepEqual(readDefault.sync({ buffer, offset: 4, }), {
			value: "abc",
			source: buffer.subarray(4, 7),
		});

		const readCustom = stringReader(Encoding.ASCII, { terminator: "3", });

		assert.deepEqual(readCustom.sync({ buffer, offset: 0, }), {
			value: "12",
			source: buffer.subarray(0, 3),
		});

		assert.deepEqual(readCustom.sync({ buffer, offset: 3, }), {
			value: "\0abc",
			source: buffer.subarray(3, 7),
		});

		const readCount = stringReader(Encoding.ASCII, { count: 2, });

		assert.deepEqual(readCount.sync({ buffer, offset: 0, }), {
			value: "12",
			source: buffer.subarray(0, 2),
		});

		assert.deepEqual(readCount.sync({ buffer, offset: 2, }), {
			value: "3\0",
			source: buffer.subarray(2, 4),
		});

		assert.deepEqual(readCount.sync({ buffer, offset: 4, }), {
			value: "ab",
			source: buffer.subarray(4, 6),
		});

		assert.throws(() => readCount.sync({ buffer, offset: 6, }));

		const readByteLengthAscii = stringReader(Encoding.ASCII, { byteLength: 6, });

		assert.deepEqual(readByteLengthAscii.sync({ buffer, offset: 0, }), {
			value: "123\0ab",
			source: buffer.subarray(0, 6),
		});

		assert.throws(() => readByteLengthAscii.sync({ buffer, offset: 2, }));

		const readByteLengthUtf16 = stringReader(Encoding.UTF16, { byteLength: 5, }, ByteOrder.BigEndian);

		assert.deepEqual(readByteLengthUtf16.sync({ buffer, offset: 0, }), {
			value: "\u3132\u3300\u6162",
			source: buffer.subarray(0, 6),
		});

		const readByteLengthNone = stringReader(Encoding.ASCII, { byteLength: 0, });

		assert.deepEqual(readByteLengthNone.sync({ buffer, offset: 0, }), {
			value: "",
			source: buffer.subarray(0, 0),
		});
	});

	test("async", async () => {
		const buffer = new Uint8Array([ 0x31, 0x32, 0x33, 0x00, 0x61, 0x62, 0x63, ]);

		let offset = 0;

		const advanceOffset = async (value: number) => {
			offset += value;
			return {
				buffer: buffer.subarray(offset, offset + 2),
				offset: 0,
			};
		};

		const readDefault = stringReader(Encoding.ASCII);

		assert.deepEqual(await readDefault.async({ buffer: buffer.subarray(0, 2), offset: 0, }, advanceOffset), {
			value: "123",
			source: buffer.subarray(0, 4),
		});

		assert.deepEqual(await readDefault.async({ buffer: buffer.subarray(4, 6), offset: 0, }, advanceOffset), {
			value: "abc",
			source: buffer.subarray(4, 7),
		});

		offset = 0;

		const readCustom = stringReader(Encoding.ASCII, { terminator: "3", });

		assert.deepEqual(await readCustom.async({ buffer: buffer.subarray(0, 2), offset: 0, }, advanceOffset), {
			value: "12",
			source: buffer.subarray(0, 3),
		});

		assert.deepEqual(await readCustom.async({ buffer: buffer.subarray(3, 5), offset: 0, }, advanceOffset), {
			value: "\0abc",
			source: buffer.subarray(3, 7),
		});

		offset = 0;

		const readCount = stringReader(Encoding.ASCII, { count: 2, });

		assert.deepEqual(await readCount.async({ buffer: buffer.subarray(0, 2), offset: 0, }, advanceOffset), {
			value: "12",
			source: buffer.subarray(0, 2),
		});

		assert.deepEqual(await readCount.async({ buffer: buffer.subarray(2, 4), offset: 0, }, advanceOffset), {
			value: "3\0",
			source: buffer.subarray(2, 4),
		});

		assert.deepEqual(await readCount.async({ buffer: buffer.subarray(4, 6), offset: 0, }, advanceOffset), {
			value: "ab",
			source: buffer.subarray(4, 6),
		});

		await assert.rejects(async () => readCount.async({ buffer: buffer.subarray(6, 7), offset: 0, }, advanceOffset));

		offset = 0;

		const readByteLengthAscii = stringReader(Encoding.ASCII, { byteLength: 6, });

		assert.deepEqual(await readByteLengthAscii.async({ buffer: buffer.subarray(0, 2), offset: 0, }, advanceOffset), {
			value: "123\0ab",
			source: buffer.subarray(0, 6),
		});

		await assert.rejects(async () => readByteLengthAscii.async({ buffer: buffer.subarray(2, 4), offset: 2, }, advanceOffset));

		offset = 0;

		const readByteLengthUtf16 = stringReader(Encoding.UTF16, { byteLength: 5, }, ByteOrder.BigEndian);

		assert.deepEqual(await readByteLengthUtf16.async({ buffer: buffer.subarray(0, 2), offset: 0, }, advanceOffset), {
			value: "\u3132\u3300\u6162",
			source: buffer.subarray(0, 6),
		});
	});
});


