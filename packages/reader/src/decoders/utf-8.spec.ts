import test from 'ava';

import { BinaryReader } from '../binary-reader.js';
import { DataType } from '../data/data-type.js';
import { Encoding } from '../encoding.js';
import { ReadError } from '../read-error.js';

const type = DataType.char(Encoding.UTF8);

test('valid', ({ deepEqual }) => {
	const valid = new BinaryReader(
		new Uint8Array([
			...[0x7f],
			...[0xc2, 0x80],
			...[0xdf, 0xbf],
			...[0xe0, 0xa0, 0x80],
			...[0xed, 0x9f, 0xbf],
			...[0xee, 0x80, 0x80],
			...[0xef, 0xbf, 0xbf],
			...[0xf0, 0x90, 0x80, 0x80],
			...[0xf4, 0x8f, 0xbf, 0xbf],
		]),
	);

	deepEqual(valid.next(type), { value: String.fromCodePoint(0x7f), byteLength: 1 });
	deepEqual(valid.next(type), { value: String.fromCodePoint(0x80), byteLength: 2 });
	deepEqual(valid.next(type), { value: String.fromCodePoint(0x07ff), byteLength: 2 });
	deepEqual(valid.next(type), { value: String.fromCodePoint(0x0800), byteLength: 3 });
	deepEqual(valid.next(type), { value: String.fromCodePoint(0xd7ff), byteLength: 3 });
	deepEqual(valid.next(type), { value: String.fromCodePoint(0xe000), byteLength: 3 });
	deepEqual(valid.next(type), { value: String.fromCodePoint(0xffff), byteLength: 3 });
	deepEqual(valid.next(type), { value: String.fromCodePoint(0x010000), byteLength: 4 });
	deepEqual(valid.next(type), { value: String.fromCodePoint(0x10ffff), byteLength: 4 });
});

test('incomplete', ({ deepEqual, throws }) => {
	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0xc2])).next(type)),
		new ReadError('incomplete UTF-8 bytes', type, new Uint8Array([0xc2])),
	);

	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0xe0, 0xa0])).next(type)),
		new ReadError('incomplete UTF-8 bytes', type, new Uint8Array([0xe0, 0xa0])),
	);

	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0xf0, 0x90, 0x80])).next(type)),
		new ReadError('incomplete UTF-8 bytes', type, new Uint8Array([0xf0, 0x90, 0x80])),
	);
});

test('invalid', ({ deepEqual, is, throws }) => {
	const reader = new BinaryReader(
		new Uint8Array([
			...[0x80],
			...[0xbf],
			...[0xc0],
			...[0xc1],
			...[0xc2, 0x7f],
			...[0xc2, 0xc0],
			...[0xe0, 0x80, 0x80],
			...[0xe0, 0x9f, 0x80],
			...[0xed, 0xa0, 0x80],
			...[0xf0, 0x8f, 0x80, 0x80],
			...[0xf4, 0x90, 0x80, 0x80],
		]),
	);

	const expectedError = (start: number, end: number) =>
		new ReadError('invalid UTF-8 bytes', type, reader.buffer.slice(start, end));

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(0, 1),
	);

	is(reader.offset, 0);
	reader.seek(1);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(1, 2),
	);

	is(reader.offset, 1);
	reader.seek(2);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(2, 3),
	);

	is(reader.offset, 2);
	reader.seek(3);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(3, 4),
	);

	is(reader.offset, 3);
	reader.seek(4);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(4, 6),
	);

	is(reader.offset, 4);
	reader.seek(6);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(6, 8),
	);

	is(reader.offset, 6);
	reader.seek(8);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(8, 11),
	);

	is(reader.offset, 8);
	reader.seek(11);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(11, 14),
	);

	is(reader.offset, 11);
	reader.seek(14);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(14, 17),
	);

	is(reader.offset, 14);
	reader.seek(17);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(17, 21),
	);

	is(reader.offset, 17);
	reader.seek(21);

	deepEqual(
		throws(() => reader.next(type)),
		expectedError(21, 25),
	);

	is(reader.offset, 21);
});
