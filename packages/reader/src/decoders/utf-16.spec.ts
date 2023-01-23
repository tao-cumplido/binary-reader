import test from 'ava';

import { ByteOrder } from '../byte-order.js';
import { ReadError } from '../read-error.js';
import { utf16 as decode } from './utf-16.js';

test('valid', ({ deepEqual }) => {
	const buffer = new Uint8Array([
		...[0xd7, 0xff],
		...[0xe0, 0x00],
		...[0xd8, 0x00, 0xdc, 0x00],
		...[0xdb, 0xff, 0xdf, 0xff],
	]);

	deepEqual(decode({ buffer, offset: 0, byteOrder: ByteOrder.BigEndian }), {
		value: String.fromCodePoint(0xd7ff),
		source: buffer.subarray(0, 2),
	});

	deepEqual(decode({ buffer, offset: 2, byteOrder: ByteOrder.BigEndian }), {
		value: String.fromCodePoint(0xe000),
		source: buffer.subarray(2, 4),
	});

	deepEqual(decode({ buffer, offset: 4, byteOrder: ByteOrder.BigEndian }), {
		value: String.fromCodePoint(0x10000),
		source: buffer.subarray(4, 8),
	});

	deepEqual(decode({ buffer, offset: 8, byteOrder: ByteOrder.BigEndian }), {
		value: String.fromCodePoint(0x10ffff),
		source: buffer.subarray(8, 12),
	});
});

test('invalid', ({ deepEqual, throws }) => {
	const message = 'invalid UTF-16 bytes';

	{
		const buffer = new Uint8Array([0xd8, 0x00, 0xd7, 0xff]);
		deepEqual(
			throws(() => decode({ buffer, offset: 0, byteOrder: ByteOrder.BigEndian })),
			new ReadError(message, buffer.subarray()),
		);
	}

	{
		const buffer = new Uint8Array([0xdc, 0x00, 0xd7, 0xff]);
		deepEqual(
			throws(() => decode({ buffer, offset: 0, byteOrder: ByteOrder.BigEndian })),
			new ReadError(message, buffer.subarray()),
		);
	}

	{
		const buffer = new Uint8Array([0xdc, 0x00, 0xd8, 0x00]);
		deepEqual(
			throws(() => decode({ buffer, offset: 0, byteOrder: ByteOrder.BigEndian })),
			new ReadError(message, buffer.subarray()),
		);
	}
});
