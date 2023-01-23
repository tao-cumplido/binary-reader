import test from 'ava';

import { ByteOrder } from '../byte-order.js';
import { floatReader } from './float.js';

test('single precision', ({ deepEqual }) => {
	const view = new DataView(new ArrayBuffer(16));
	const buffer = new Uint8Array(view.buffer);

	view.setFloat32(0, 1 / 2 ** 6, true);
	view.setFloat32(4, -1 / 2 ** 6, true);
	view.setFloat32(8, 1 / 2 ** 6, false);
	view.setFloat32(12, -1 / 2 ** 6, false);

	const read = floatReader({ byteLength: 4 });

	deepEqual(read({ buffer, offset: 0, byteOrder: ByteOrder.LittleEndian }), {
		value: 1 / 2 ** 6,
		source: buffer.subarray(0, 4),
	});

	deepEqual(read({ buffer, offset: 4, byteOrder: ByteOrder.LittleEndian }), {
		value: -1 / 2 ** 6,
		source: buffer.subarray(4, 8),
	});

	deepEqual(read({ buffer, offset: 8, byteOrder: ByteOrder.BigEndian }), {
		value: 1 / 2 ** 6,
		source: buffer.subarray(8, 12),
	});

	deepEqual(read({ buffer, offset: 12, byteOrder: ByteOrder.BigEndian }), {
		value: -1 / 2 ** 6,
		source: buffer.subarray(12, 16),
	});
});

test('double precision', ({ deepEqual }) => {
	const view = new DataView(new ArrayBuffer(32));
	const buffer = new Uint8Array(view.buffer);

	view.setFloat64(0, 1 / 2 ** 15, true);
	view.setFloat64(8, -1 / 2 ** 15, true);
	view.setFloat64(16, 1 / 2 ** 15, false);
	view.setFloat64(24, -1 / 2 ** 15, false);

	const read = floatReader({ byteLength: 8 });

	deepEqual(read({ buffer, offset: 0, byteOrder: ByteOrder.LittleEndian }), {
		value: 1 / 2 ** 15,
		source: buffer.subarray(0, 8),
	});

	deepEqual(read({ buffer, offset: 8, byteOrder: ByteOrder.LittleEndian }), {
		value: -1 / 2 ** 15,
		source: buffer.subarray(8, 16),
	});

	deepEqual(read({ buffer, offset: 16, byteOrder: ByteOrder.BigEndian }), {
		value: 1 / 2 ** 15,
		source: buffer.subarray(16, 24),
	});

	deepEqual(read({ buffer, offset: 24, byteOrder: ByteOrder.BigEndian }), {
		value: -1 / 2 ** 15,
		source: buffer.subarray(24, 32),
	});
});
