/* eslint-disable @typescript-eslint/naming-convention */

import test from 'ava';

import { BinaryReader } from './binary-reader.js';
import { ByteOrder } from './byte-order.js';
import { DataType } from './data-type.js';

test('hasNext', ({ is }) => {
	const reader = new BinaryReader(new Uint8Array([0, 1, 2]));

	is(reader.hasNext(), true);
	is(reader.hasNext(3), true);
	is(reader.hasNext(4), false);

	reader.seek(3);

	is(reader.hasNext(), false);
});

test('setByteOrder', ({ is }) => {
	const reader = new BinaryReader(new Uint8Array([0, 1, 2, 3]), ByteOrder.BigEndian);

	is(reader.next(DataType.Uint16), 0x1);

	reader.setByteOrder(ByteOrder.LittleEndian);

	is(reader.next(DataType.Uint16), 0x302);
});

test('readByteOrder', ({ is }) => {
	const reader = new BinaryReader(new Uint8Array([0xfe, 0xff]), ByteOrder.LittleEndian);

	reader.readByteOrderMark();

	is(reader.byteOrder, ByteOrder.BigEndian);
});

test('align', ({ is }) => {
	const reader = new BinaryReader(new Uint8Array(8));

	reader.align(4);

	is(reader.offset, 0);

	reader.skip(1);
	reader.align(4);

	is(reader.offset, 4);

	reader.skip(2);
	reader.align(4);

	is(reader.offset, 8);
});
