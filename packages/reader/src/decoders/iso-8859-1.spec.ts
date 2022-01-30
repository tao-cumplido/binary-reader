import test from 'ava';

import { BinaryReader } from '../binary-reader.js';
import { DataType } from '../data/data-type.js';
import { Encoding } from '../encoding.js';
import { ReadError } from '../read-error.js';

const type = DataType.char(Encoding.ISO88591);

test('valid', ({ deepEqual }) => {
	const reader = new BinaryReader(new Uint8Array([0x20, 0x7e, 0xa0, 0xff]));
	deepEqual(reader.next(type), { value: ' ', byteLength: 1 });
	deepEqual(reader.next(type), { value: '~', byteLength: 1 });
	deepEqual(reader.next(type), { value: '\xa0', byteLength: 1 });
	deepEqual(reader.next(type), { value: 'ÿ', byteLength: 1 });
});

test('invalid', ({ deepEqual, throws }) => {
	const message = 'invalid ISO 8859-1 bytes';

	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0x00])).next(type)),
		new ReadError(message, type, new Uint8Array([0x00])),
	);

	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0x1f])).next(type)),
		new ReadError(message, type, new Uint8Array([0x1f])),
	);

	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0x7f])).next(type)),
		new ReadError(message, type, new Uint8Array([0x7f])),
	);

	deepEqual(
		throws(() => new BinaryReader(new Uint8Array([0x9f])).next(type)),
		new ReadError(message, type, new Uint8Array([0x9f])),
	);
});
