import assert from "node:assert/strict";
import test from "node:test";

import { ByteOrder } from "../byte-order.js";
import { ReadError } from "../read-error.js";
import { utf32 } from "./utf-32.js";

test.describe("UTF-32", () => {
	test("valid", () => {
		const buffer = new Uint8Array([
			...[ 0x00, 0x00, 0xd7, 0xff, ],
			...[ 0x00, 0x00, 0xe0, 0x00, ],
			...[ 0x00, 0x10, 0xff, 0xff, ],
		]);

		assert.deepEqual(
			utf32.decode({ buffer, offset: 0, byteOrder: ByteOrder.BigEndian, }),
			{ value: String.fromCodePoint(0xd7ff), source: new Uint8Array([ 0x00, 0x00, 0xd7, 0xff, ]), },
		);

		assert.deepEqual(
			utf32.decode({ buffer, offset: 4, byteOrder: ByteOrder.BigEndian, }),
			{ value: String.fromCodePoint(0xe000), source: new Uint8Array([ 0x00, 0x00, 0xe0, 0x00, ]), },
		);

		assert.deepEqual(
			utf32.decode({ buffer, offset: 8, byteOrder: ByteOrder.BigEndian, }),
			{ value: String.fromCodePoint(0x10ffff), source: new Uint8Array([ 0x00, 0x10, 0xff, 0xff, ]), },
		);
	});

	test("invalid", () => {
		const errorMessage = "invalid UTF-32 code point";

		assert.throws(
			() => utf32.decode({ buffer: new Uint8Array([ 0x00, 0x00, 0xd8, 0x00, ]), offset: 0, byteOrder: ByteOrder.BigEndian, }),
			new ReadError(errorMessage, new Uint8Array([ 0x00, 0x00, 0xd8, 0x00, ])),
		);

		assert.throws(
			() => utf32.decode({ buffer: new Uint8Array([ 0x00, 0x00, 0xdf, 0xff, ]), offset: 0, byteOrder: ByteOrder.BigEndian, }),
			new ReadError(errorMessage, new Uint8Array([ 0x00, 0x00, 0xdf, 0xff, ])),
		);

		assert.throws(
			() => utf32.decode({ buffer: new Uint8Array([ 0x00, 0x11, 0x00, 0x00, ]), offset: 0, byteOrder: ByteOrder.BigEndian, }),
			new ReadError(errorMessage, new Uint8Array([ 0x00, 0x11, 0x00, 0x00, ])),
		);
	});
});


