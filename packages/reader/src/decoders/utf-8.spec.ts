import test from 'ava';

import { ReadError } from '../index.js';
import { utf8 } from './utf-8.js';

test('valid', ({ deepEqual }) => {
	const buffer = new Uint8Array([
		...[0x7f],
		...[0xc2, 0x80],
		...[0xdf, 0xbf],
		...[0xe0, 0xa0, 0x80],
		...[0xed, 0x9f, 0xbf],
		...[0xee, 0x80, 0x80],
		...[0xef, 0xbf, 0xbf],
		...[0xf0, 0x90, 0x80, 0x80],
		...[0xf4, 0x8f, 0xbf, 0xbf],
	]);

	deepEqual(utf8.decode({ buffer, offset: 0 }), { value: String.fromCodePoint(0x7f), source: buffer.subarray(0, 1) });
	deepEqual(utf8.decode({ buffer, offset: 1 }), { value: String.fromCodePoint(0x80), source: buffer.subarray(1, 3) });
	deepEqual(utf8.decode({ buffer, offset: 3 }), { value: String.fromCodePoint(0x07ff), source: buffer.subarray(3, 5) });
	deepEqual(utf8.decode({ buffer, offset: 5 }), { value: String.fromCodePoint(0x0800), source: buffer.subarray(5, 8) });
	deepEqual(utf8.decode({ buffer, offset: 8 }), { value: String.fromCodePoint(0xd7ff), source: buffer.subarray(8, 11) });
	deepEqual(utf8.decode({ buffer, offset: 11 }), {
		value: String.fromCodePoint(0xe000),
		source: buffer.subarray(11, 14),
	});
	deepEqual(utf8.decode({ buffer, offset: 14 }), {
		value: String.fromCodePoint(0xffff),
		source: buffer.subarray(14, 17),
	});
	deepEqual(utf8.decode({ buffer, offset: 17 }), {
		value: String.fromCodePoint(0x010000),
		source: buffer.subarray(17, 21),
	});
	deepEqual(utf8.decode({ buffer, offset: 21 }), {
		value: String.fromCodePoint(0x10ffff),
		source: buffer.subarray(21, 25),
	});
});

test('incomplete', ({ deepEqual, throws }) => {
	const message = 'incomplete UTF-8 bytes';

	{
		const buffer = new Uint8Array([0xc2]);
		deepEqual(
			throws(() => utf8.decode({ buffer, offset: 0 })),
			new ReadError(message, buffer.subarray()),
		);
	}

	{
		const buffer = new Uint8Array([0xe0, 0xa0]);
		deepEqual(
			throws(() => utf8.decode({ buffer, offset: 0 })),
			new ReadError(message, buffer.subarray()),
		);
	}

	{
		const buffer = new Uint8Array([0xf0, 0x90, 0x80]);
		deepEqual(
			throws(() => utf8.decode({ buffer, offset: 0 })),
			new ReadError(message, buffer.subarray()),
		);
	}
});

test('invalid', ({ deepEqual, throws }) => {
	const buffer = new Uint8Array([
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
	]);

	const expectedError = (start: number, end: number) =>
		new ReadError('invalid UTF-8 bytes', buffer.subarray(start, end));

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 0 })),
		expectedError(0, 1),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 1 })),
		expectedError(1, 2),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 2 })),
		expectedError(2, 3),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 3 })),
		expectedError(3, 4),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 4 })),
		expectedError(4, 6),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 6 })),
		expectedError(6, 8),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 8 })),
		expectedError(8, 11),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 11 })),
		expectedError(11, 14),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 14 })),
		expectedError(14, 17),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 17 })),
		expectedError(17, 21),
	);

	deepEqual(
		throws(() => utf8.decode({ buffer, offset: 21 })),
		expectedError(21, 25),
	);
});
