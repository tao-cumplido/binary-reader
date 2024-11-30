import assert from "node:assert/strict";
import test from "node:test";

import { BinaryReader } from "./binary-reader.js";
import { ByteOrder } from "./byte-order.js";
import { DataType } from "./data-type.js";
import { MatchError } from "./pattern/match.js";

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

	test.describe("find", () => {
		test("empty source", () => {
			const reader = new BinaryReader(new Uint8Array());
			assert.equal(reader.find([ 0, ]), undefined);
			assert.equal(reader.offset, 0);
		});

		test("numbers", () => {
			const reader = new BinaryReader(new Uint8Array([ 0x00, 0x01, 0x02, 0x03, 0x01, 0x02, ]));

			assert.equal(reader.find([ 0x01, 0x02, ]), 1);
			assert.equal(reader.offset, 3);

			assert.equal(reader.find([ 0x05, ]), undefined);
			assert.equal(reader.offset, 3);

			assert.equal(reader.find([ 0x01, 0x02, ]), 4);
			assert.equal(reader.offset, 6);
		});

		test("patterns", () => {
			const reader = new BinaryReader(new Uint8Array([ 0x00, 0x01, 0x02, 0x03, 0x01, 0x02, ]));

			assert.equal(reader.find([ "0?", "??", "02", ]), 0);
			assert.equal(reader.offset, 3);

			assert.equal(reader.find([ "0?", "??", "02", ]), 3);
			assert.equal(reader.offset, 6);

			assert.equal(reader.find([ "??", "$0+1", ], { offset: 0, }), 0);
			assert.equal(reader.offset, 2);

			assert.equal(reader.find([ "??", "$0+1", ]), 2);
			assert.equal(reader.offset, 4);

			assert.equal(reader.find([ "??", "$0+1", ], { offset: 3, }), 4);
			assert.equal(reader.offset, 6);
		});

		test("data types", () => {
			const reader = new BinaryReader(new Uint8Array([ 0x20, 0x00, 0x00, 0x30, ]), ByteOrder.BigEndian);

			assert.equal(reader.find([ (read) => {
				const value = read(DataType.Uint16);
				return value === 0x2000;
			}, ]), 0);
			assert.equal(reader.offset, 2);

			assert.equal(reader.find([ (read) => {
				const value = read(DataType.Uint16);
				return value === 0x2000;
			}, ]), undefined);
			assert.equal(reader.offset, 2);

			assert.equal(reader.find([ () => {
				const value = reader.next(DataType.Uint16);
				return value === 0x30;
			}, ]), 2);
			assert.equal(reader.offset, 4);
		});

		test("data types with backreference", () => {
			const reader = new BinaryReader(new Uint8Array([ 0x00, 0x01, ]));

			const result = reader.find([
				(read) => {
					const value = read(DataType.Uint8);
					return value === 0x00;
				},
				(read, backreferences) => {
					const reference = backreferences.next(DataType.Uint8);
					return read(DataType.Uint8) === reference + 1;
				},
			]);

			assert.equal(result, 0);
			assert.equal(reader.offset, 2);
		});

		test("invalid pattern", () => {
			const reader = new BinaryReader(new Uint8Array([ 0x00, 0x01, 0x02, ]));

			assert.throws(() => reader.find([ 0x01, "xx", ]), (error) => error instanceof MatchError);
			assert.equal(reader.offset, 0);
		});
	});
});


