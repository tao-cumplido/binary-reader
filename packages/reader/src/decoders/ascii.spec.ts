import test from 'ava';

import { ReadError } from '../index.js';
import { ascii as decode } from './ascii.js';

test('valid', ({ deepEqual }) => {
	const buffer = new Uint8Array([0x00, 0x7f]);
	deepEqual(decode({ buffer, offset: 0 }), { value: '\0', source: buffer.subarray(0, 1) });
	deepEqual(decode({ buffer, offset: 1 }), { value: '\x7f', source: buffer.subarray(1, 2) });
});

test('invalid', ({ deepEqual, throws }) => {
	const buffer = new Uint8Array([0x80]);
	deepEqual(
		throws(() => decode({ buffer, offset: 0 })),
		new ReadError('invalid ASCII bytes', buffer.subarray()),
	);
});
