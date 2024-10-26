import assert from "node:assert/strict";
import test from "node:test";

import { ReadError } from "../index.js";
import { utf8 } from "./utf-8.js";

test.describe("UTF-8", () => {
	test("valid", () => {
		const buffer = new Uint8Array([
			...[ 0x7f, ],
			...[ 0xc2, 0x80, ],
			...[ 0xdf, 0xbf, ],
			...[ 0xe0, 0xa0, 0x80, ],
			...[ 0xed, 0x9f, 0xbf, ],
			...[ 0xee, 0x80, 0x80, ],
			...[ 0xef, 0xbf, 0xbf, ],
			...[ 0xf0, 0x90, 0x80, 0x80, ],
			...[ 0xf4, 0x8f, 0xbf, 0xbf, ],
		]);

		assert.deepEqual(
			utf8.decode({ buffer, offset: 0, }),
			{ value: String.fromCodePoint(0x7f), source: new Uint8Array([ 0x7f, ]), },
		);

		assert.deepEqual(
			utf8.decode({ buffer, offset: 1, }),
			{ value: String.fromCodePoint(0x80), source: new Uint8Array([ 0xc2, 0x80, ]), },
		);

		assert.deepEqual(
			utf8.decode({ buffer, offset: 3, }),
			{ value: String.fromCodePoint(0x07ff), source: new Uint8Array([ 0xdf, 0xbf, ]), },
		);

		assert.deepEqual(
			utf8.decode({ buffer, offset: 5, }),
			{ value: String.fromCodePoint(0x0800), source: new Uint8Array([ 0xe0, 0xa0, 0x80, ]), },
		);

		assert.deepEqual(
			utf8.decode({ buffer, offset: 8, }),
			{ value: String.fromCodePoint(0xd7ff), source: new Uint8Array([ 0xed, 0x9f, 0xbf, ]), },
		);

		assert.deepEqual(
			utf8.decode({ buffer, offset: 11, }),
			{ value: String.fromCodePoint(0xe000), source: new Uint8Array([ 0xee, 0x80, 0x80, ]), },
		);

		assert.deepEqual(
			utf8.decode({ buffer, offset: 14, }),
			{ value: String.fromCodePoint(0xffff), source: new Uint8Array([ 0xef, 0xbf, 0xbf, ]), },
		);

		assert.deepEqual(
			utf8.decode({ buffer, offset: 17, }),
			{ value: String.fromCodePoint(0x010000), source: new Uint8Array([ 0xf0, 0x90, 0x80, 0x80, ]), },
		);

		assert.deepEqual(
			utf8.decode({ buffer, offset: 21, }),
			{ value: String.fromCodePoint(0x10ffff), source: new Uint8Array([ 0xf4, 0x8f, 0xbf, 0xbf, ]), },
		);
	});

	test("incomplete", () => {
		const errorMessage = "incomplete UTF-8 bytes";

		assert.throws(
			() => utf8.decode({ buffer: new Uint8Array([ 0xc2, ]), offset: 0, }),
			new ReadError(errorMessage, new Uint8Array([ 0xc2, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer: new Uint8Array([ 0xe0, 0xa0, ]), offset: 0, }),
			new ReadError(errorMessage, new Uint8Array([ 0xe0, 0xa0, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer: new Uint8Array([ 0xf0, 0x90, 0x80, ]), offset: 0, }),
			new ReadError(errorMessage, new Uint8Array([ 0xf0, 0x90, 0x80, ])),
		);
	});

	test("invalid", () => {
		const errorMessage = "invalid UTF-8 bytes";

		const buffer = new Uint8Array([
			...[ 0x80, ],
			...[ 0xbf, ],
			...[ 0xc0, ],
			...[ 0xc1, ],
			...[ 0xc2, 0x7f, ],
			...[ 0xc2, 0xc0, ],
			...[ 0xe0, 0x80, 0x80, ],
			...[ 0xe0, 0x9f, 0x80, ],
			...[ 0xed, 0xa0, 0x80, ],
			...[ 0xf0, 0x8f, 0x80, 0x80, ],
			...[ 0xf4, 0x90, 0x80, 0x80, ],
		]);

		assert.throws(
			() => utf8.decode({ buffer, offset: 0, }),
			new ReadError(errorMessage, new Uint8Array([ 0x80, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 1, }),
			new ReadError(errorMessage, new Uint8Array([ 0xbf, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 2, }),
			new ReadError(errorMessage, new Uint8Array([ 0xc0, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 3, }),
			new ReadError(errorMessage, new Uint8Array([ 0xc1, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 4, }),
			new ReadError(errorMessage, new Uint8Array([ 0xc2, 0x7f, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 6, }),
			new ReadError(errorMessage, new Uint8Array([ 0xc2, 0xc0, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 8, }),
			new ReadError(errorMessage, new Uint8Array([ 0xe0, 0x80, 0x80, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 11, }),
			new ReadError(errorMessage, new Uint8Array([ 0xe0, 0x9f, 0x80, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 14, }),
			new ReadError(errorMessage, new Uint8Array([ 0xed, 0xa0, 0x80, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 17, }),
			new ReadError(errorMessage, new Uint8Array([ 0xf0, 0x8f, 0x80, 0x80, ])),
		);

		assert.throws(
			() => utf8.decode({ buffer, offset: 21, }),
			new ReadError(errorMessage, new Uint8Array([ 0xf4, 0x90, 0x80, 0x80, ])),
		);
	});
});


