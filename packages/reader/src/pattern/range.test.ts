import assert from "node:assert/strict";
import test from "node:test";

import { rangePattern } from "./range.js";

test.describe("range pattern", () => {
	test("(4,a)", () => {
		const validate = rangePattern("(4,a)");

		assert(validate);

		for (let i = 0x00; i <= 0xff; i++) {
			if (i > 0x04 && i < 0x0a) {
				assert(validate(i, new Uint8Array()));
			} else {
				assert(!validate(i, new Uint8Array()));
			}
		}
	});

	test("(4,a]", () => {
		const validate = rangePattern("(4,a]");

		assert(validate);

		for (let i = 0x00; i <= 0xff; i++) {
			if (i > 0x04 && i <= 0x0a) {
				assert(validate(i, new Uint8Array()));
			} else {
				assert(!validate(i, new Uint8Array()));
			}
		}
	});

	test("[4,a)", () => {
		const validate = rangePattern("[4,a)");

		assert(validate);

		for (let i = 0x00; i <= 0xff; i++) {
			if (i >= 0x04 && i < 0x0a) {
				assert(validate(i, new Uint8Array()));
			} else {
				assert(!validate(i, new Uint8Array()));
			}
		}
	});

	test("[4,a]", () => {
		const validate = rangePattern("[4,a]");

		assert(validate);

		for (let i = 0x00; i <= 0xff; i++) {
			if (i >= 0x04 && i <= 0x0a) {
				assert(validate(i, new Uint8Array()));
			} else {
				assert(!validate(i, new Uint8Array()));
			}
		}
	});
});
