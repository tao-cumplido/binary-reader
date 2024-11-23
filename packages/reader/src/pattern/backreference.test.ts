import assert from "node:assert/strict";
import test from "node:test";

import { backreferencePattern } from "./backreference.js";

test.describe("backreference pattern", () => {
	test("$0", () => {
		const validate = backreferencePattern("$0");

		assert(validate);
		assert(validate(0, new Uint8Array([ 0, ])));
		assert(!validate(0, new Uint8Array([ 1, ])));
	});

	test("$0+1", () => {
		const validate = backreferencePattern("$0+1");

		assert(validate);
		assert(validate(1, new Uint8Array([ 0, ])));
		assert(validate(2, new Uint8Array([ 1, ])));
		assert(!validate(0, new Uint8Array([ 0, ])));
	});

	test("$0-1", () => {
		const validate = backreferencePattern("$0-1");

		assert(validate);
		assert(validate(0, new Uint8Array([ 1, ])));
		assert(validate(1, new Uint8Array([ 2, ])));
		assert(!validate(0, new Uint8Array([ 0, ])));
	});

	test("$0*2", () => {
		const validate = backreferencePattern("$0*2");

		assert(validate);
		assert(validate(0, new Uint8Array([ 0, ])));
		assert(validate(2, new Uint8Array([ 1, ])));
		assert(validate(4, new Uint8Array([ 2, ])));
		assert(!validate(1, new Uint8Array([ 1, ])));
	});

	test("$0/2", () => {
		const validate = backreferencePattern("$0/2");

		assert(validate);
		assert(validate(0, new Uint8Array([ 0, ])));
		assert(validate(0, new Uint8Array([ 1, ])));
		assert(validate(1, new Uint8Array([ 2, ])));
		assert(validate(1, new Uint8Array([ 3, ])));
		assert(validate(2, new Uint8Array([ 4, ])));
		assert(!validate(1, new Uint8Array([ 1, ])));
	});

	test("$0+$1", () => {
		const validate = backreferencePattern("$0+$1");

		assert(validate);
		assert(validate(1, new Uint8Array([ 0, 1, ])));
		assert(validate(3, new Uint8Array([ 1, 2, ])));
		assert(!validate(0, new Uint8Array([ 3, 4,  ])));
	});
});
