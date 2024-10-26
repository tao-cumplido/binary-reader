import assert from "node:assert/strict";
import test from "node:test";

import { ByteOrder } from "../byte-order.js";
import { ReadError } from "../read-error.js";
import { utf16 } from "./utf-16.js";

test.describe("UTF-16", () => {
	test("valid", () => {
		const buffer = new Uint8Array([
			...[ 0xd7, 0xff, ],
			...[ 0xe0, 0x00, ],
			...[ 0xd8, 0x00, 0xdc, 0x00, ],
			...[ 0xdb, 0xff, 0xdf, 0xff, ],
		]);

		assert.deepEqual(
			utf16.decode({ buffer, offset: 0, byteOrder: ByteOrder.BigEndian, }),
			{ value: String.fromCodePoint(0xd7ff), source: new Uint8Array([ 0xd7, 0xff, ]), },
		);

		assert.deepEqual(
			utf16.decode({ buffer, offset: 2, byteOrder: ByteOrder.BigEndian, }),
			{ value: String.fromCodePoint(0xe000), source: new Uint8Array([ 0xe0, 0x00, ]), },
		);

		assert.deepEqual(
			utf16.decode({ buffer, offset: 4, byteOrder: ByteOrder.BigEndian, }),
			{ value: String.fromCodePoint(0x10000), source: new Uint8Array([ 0xd8, 0x00, 0xdc, 0x00, ]), },
		);

		assert.deepEqual(
			utf16.decode({ buffer, offset: 8, byteOrder: ByteOrder.BigEndian, }),
			{ value: String.fromCodePoint(0x10ffff), source: new Uint8Array([ 0xdb, 0xff, 0xdf, 0xff, ]), },
		);
	});

	test("invalid", () => {
		const errorMessage = "invalid UTF-16 bytes";

		assert.throws(
			() => utf16.decode({ buffer: new Uint8Array([ 0xd8, 0x00, 0xd7, 0xff, ]), offset: 0, byteOrder: ByteOrder.BigEndian, }),
			new ReadError(errorMessage, new Uint8Array([ 0xd8, 0x00, 0xd7, 0xff, ])),
		);

		assert.throws(
			() => utf16.decode({ buffer: new Uint8Array([ 0xdc, 0x00, 0xd7, 0xff, ]), offset: 0, byteOrder: ByteOrder.BigEndian, }),
			new ReadError(errorMessage, new Uint8Array([ 0xdc, 0x00, 0xd7, 0xff, ])),
		);

		assert.throws(
			() => utf16.decode({ buffer: new Uint8Array([ 0xdc, 0x00, 0xd8, 0x00, ]), offset: 0, byteOrder: ByteOrder.BigEndian, }),
			new ReadError(errorMessage, new Uint8Array([ 0xdc, 0x00, 0xd8, 0x00, ])),
		);
	});
});


