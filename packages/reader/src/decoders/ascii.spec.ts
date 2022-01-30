import test from 'ava';

import { BinaryReader } from '../binary-reader.js';
import { DataType } from '../data/data-type.js';
import { Encoding } from '../encoding.js';
import { ReadError } from '../read-error.js';

const type = DataType.char(Encoding.ASCII);

test('valid', ({ deepEqual }) => {
	const reader = new BinaryReader(new Uint8Array([0x00, 0x7f]));
	deepEqual(reader.next(type), { value: '\0', byteLength: 1 });
	deepEqual(reader.next(type), { value: '\x7f', byteLength: 1 });
});

test('invalid', ({ deepEqual, throws }) => {
	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0x80])).next(type)),
		new ReadError('invalid ASCII bytes', type, new Uint8Array([0x80])),
	);
});
