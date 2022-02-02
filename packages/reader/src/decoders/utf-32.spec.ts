import test from 'ava';

import { BinaryReader } from '../binary-reader.js';
import { ByteOrder } from '../byte-order.js';
import { DataType } from '../data/data-type.js';
import { Encoding } from '../encoding.js';
import { ReadError } from '../read-error.js';

const type = DataType.char(Encoding.UTF32, ByteOrder.BigEndian);

test('valid', ({ deepEqual }) => {
	const reader = new BinaryReader(
		new Uint8Array([...[0x00, 0x00, 0xd7, 0xff], ...[0x00, 0x00, 0xe0, 0x00], ...[0x00, 0x10, 0xff, 0xff]]),
	);

	deepEqual(reader.next(type), { value: String.fromCodePoint(0xd7ff), byteLength: 4 });
	deepEqual(reader.next(type), { value: String.fromCodePoint(0xe000), byteLength: 4 });
	deepEqual(reader.next(type), { value: String.fromCodePoint(0x10ffff), byteLength: 4 });
});

test('invalid', ({ deepEqual, throws }) => {
	const message = 'invalid UTF-32 code point';

	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0x00, 0x00, 0xd8, 0x00])).next(type)),
		new ReadError(message, type, new Uint8Array([0x00, 0x00, 0xd8, 0x00])),
	);

	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0x00, 0x00, 0xdf, 0xff])).next(type)),
		new ReadError(message, type, new Uint8Array([0x00, 0x00, 0xdf, 0xff])),
	);

	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0x00, 0x11, 0x00, 0x00])).next(type)),
		new ReadError(message, type, new Uint8Array([0x00, 0x11, 0x00, 0x00])),
	);
});
