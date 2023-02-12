import test from 'ava';

import { ReadError } from '../index.js';
import { iso88591 } from './iso-8859-1.js';

test('valid', ({ deepEqual }) => {
	const buffer = new Uint8Array([0x20, 0x7e, 0xa0, 0xff]);
	deepEqual(iso88591.decode({ buffer, offset: 0 }), { value: ' ', source: buffer.subarray(0, 1) });
	deepEqual(iso88591.decode({ buffer, offset: 1 }), { value: '~', source: buffer.subarray(1, 2) });
	deepEqual(iso88591.decode({ buffer, offset: 2 }), { value: '\xa0', source: buffer.subarray(2, 3) });
	deepEqual(iso88591.decode({ buffer, offset: 3 }), { value: 'ÿ', source: buffer.subarray(3, 4) });
});

test('invalid', ({ deepEqual, throws }) => {
	const message = 'invalid ISO 8859-1 bytes';

	const buffer = new Uint8Array([0x0, 0x1f, 0x7f, 0x9f]);

	deepEqual(
		throws(() => iso88591.decode({ buffer, offset: 0 })),
		new ReadError(message, buffer.subarray(0, 1)),
	);

	deepEqual(
		throws(() => iso88591.decode({ buffer, offset: 1 })),
		new ReadError(message, buffer.subarray(1, 2)),
	);

	deepEqual(
		throws(() => iso88591.decode({ buffer, offset: 2 })),
		new ReadError(message, buffer.subarray(2, 3)),
	);

	deepEqual(
		throws(() => iso88591.decode({ buffer, offset: 3 })),
		new ReadError(message, buffer.subarray(3, 4)),
	);
});
