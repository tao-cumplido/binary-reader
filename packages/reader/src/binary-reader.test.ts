import assert from "node:assert/strict";
import test from "node:test";

import { BinaryReader } from "./binary-reader.js";
import { ByteOrder } from "./byte-order.js";
import { DataType } from "./data-type.js";

test.describe("BinaryReader", () => {
	test("hasNext", () => {
		const reader = new BinaryReader(new Uint8Array([ 0, 1, 2, ]));

		assert.equal(reader.hasNext(), true);
		assert.equal(reader.hasNext(3), true);
		assert.equal(reader.hasNext(4), false);

		reader.seek(3);

		assert.equal(reader.hasNext(), false);
	});

	test("setByteOrder", () => {
		const reader = new BinaryReader(new Uint8Array([ 0, 1, 2, 3, ]), ByteOrder.BigEndian);

		assert.equal(reader.next(DataType.Uint16), 0x1);

		reader.setByteOrder(ByteOrder.LittleEndian);

		assert.equal(reader.next(DataType.Uint16), 0x302);
	});

	test("readByteOrder", () => {
		const reader = new BinaryReader(new Uint8Array([ 0xfe, 0xff, ]), ByteOrder.LittleEndian);

		reader.readByteOrderMark();

		assert.equal(reader.byteOrder, ByteOrder.BigEndian);
	});

	test("align", () => {
		const reader = new BinaryReader(new Uint8Array(8));

		reader.align(4);

		assert.equal(reader.offset, 0);

		reader.skip(1);
		reader.align(4);

		assert.equal(reader.offset, 4);

		reader.skip(2);
		reader.align(4);

		assert.equal(reader.offset, 8);
	});
});


