import assert from "node:assert/strict";
import test from "node:test";

import { ReadError } from "../index.js";
import { iso88591 } from "./iso-8859-1.js";

test.describe("ISO 8859-1", () => {
	test("valid", () => {
		const buffer = new Uint8Array([ 0x20, 0x7e, 0xa0, 0xff, ]);

		assert.deepEqual(
			iso88591.decode({ buffer, offset: 0, }),
			{ value: " ", source: new Uint8Array([ 0x20, ]), },
		);

		assert.deepEqual(
			iso88591.decode({ buffer, offset: 1, }),
			{ value: "~", source: new Uint8Array([ 0x7e, ]), },
		);

		assert.deepEqual(
			iso88591.decode({ buffer, offset: 2, }),
			{ value: "\xa0", source: new Uint8Array([ 0xa0, ]), },
		);

		assert.deepEqual(
			iso88591.decode({ buffer, offset: 3, }),
			{ value: "ÿ", source: new Uint8Array([ 0xff, ]), },
		);
	});

	test("invalid", () => {
		const message = "invalid ISO 8859-1 bytes";

		const buffer = new Uint8Array([ 0x00, 0x1f, 0x7f, 0x9f, ]);

		assert.throws(
			() => iso88591.decode({ buffer, offset: 0, }),
			new ReadError(message, new Uint8Array([ 0x00, ])),
		);

		assert.throws(
			() => iso88591.decode({ buffer, offset: 1, }),
			new ReadError(message, new Uint8Array([ 0x1f, ])),
		);

		assert.throws(
			() => iso88591.decode({ buffer, offset: 2, }),
			new ReadError(message, new Uint8Array([ 0x7f, ])),
		);

		assert.throws(
			() => iso88591.decode({ buffer, offset: 3, }),
			new ReadError(message, new Uint8Array([ 0x9f, ])),
		);
	});
});


