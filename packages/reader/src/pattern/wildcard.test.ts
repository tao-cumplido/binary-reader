import assert from "node:assert/strict";
import test from "node:test";

import { wildcardPattern } from "./wildcard.js";

test.describe("wildcard pattern", () => {
	test("??", () => {
		const validate = wildcardPattern("??");

		assert(validate);

		for (let i = 0x00; i <= 0xff; i++) {
			assert(validate(i, new Uint8Array()));
		}
	});

	test("?0", () => {
		const validate = wildcardPattern("?0");

		assert(validate);

		for (let i = 0x00; i <= 0xff; i++) {
			if (i % 0x10) {
				assert(!validate(i, new Uint8Array()));
			} else {
				assert(validate(i, new Uint8Array()));
			}
		}
	});

	test("0?", () => {
		const validate = wildcardPattern("0?");

		assert(validate);

		for (let i = 0x00; i < 0x10; i++) {
			assert(validate(i, new Uint8Array()));
		}

		for (let i = 0x10; i <= 0xff; i++) {
			assert(!validate(i, new Uint8Array()));
		}
	});

	test("00", () => {
		const validate = wildcardPattern("00");

		assert(validate);

		assert(validate(0x00, new Uint8Array()));

		for (let i = 0x01; i <= 0xff; i++) {
			assert(!validate(i, new Uint8Array()));
		}
	});
});
