import assert from "node:assert/strict";
import test from "node:test";

import { ReadError } from "../index.js";
import { ascii } from "./ascii.js";

test.describe("ASCII", () => {
	test("valid", () => {
		const buffer = new Uint8Array([ 0x00, 0x7f, ]);

		assert.deepEqual(
			ascii.decode({ buffer, offset: 0, }),
			{ value: "\0", source: new Uint8Array([ 0x00, ]), },
		);

		assert.deepEqual(
			ascii.decode({ buffer, offset: 1, }),
			{ value: "\x7f", source: new Uint8Array([ 0x7f, ]), },
		);
	});

	test("invalid", () => {
		const buffer = new Uint8Array([ 0x80, ]);

		assert.throws(
			() => ascii.decode({ buffer, offset: 0, }),
			new ReadError("invalid ASCII bytes", new Uint8Array([ 0x80, ])),
		);
	});
});


