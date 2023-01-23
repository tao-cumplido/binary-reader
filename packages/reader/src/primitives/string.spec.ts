import test from 'ava';

import { Encoding } from '../encoding.js';
import { stringReader } from './string.js';

test('sync', ({ deepEqual, throws }) => {
	const buffer = new Uint8Array([0x31, 0x32, 0x33, 0x00, 0x61, 0x62, 0x63]);

	const readDefault = stringReader(Encoding.ASCII);

	deepEqual(readDefault.sync({ buffer, offset: 0 }), {
		value: '123',
		source: buffer.subarray(0, 4),
	});

	deepEqual(readDefault.sync({ buffer, offset: 4 }), {
		value: 'abc',
		source: buffer.subarray(4, 7),
	});

	const readCustom = stringReader(Encoding.ASCII, { terminator: '3' });

	deepEqual(readCustom.sync({ buffer, offset: 0 }), {
		value: '12',
		source: buffer.subarray(0, 3),
	});

	deepEqual(readCustom.sync({ buffer, offset: 3 }), {
		value: '\0abc',
		source: buffer.subarray(3, 7),
	});

	const readCount = stringReader(Encoding.ASCII, { count: 2 });

	deepEqual(readCount.sync({ buffer, offset: 0 }), {
		value: '12',
		source: buffer.subarray(0, 2),
	});

	deepEqual(readCount.sync({ buffer, offset: 2 }), {
		value: '3\0',
		source: buffer.subarray(2, 4),
	});

	deepEqual(readCount.sync({ buffer, offset: 4 }), {
		value: 'ab',
		source: buffer.subarray(4, 6),
	});

	throws(() => readCount.sync({ buffer, offset: 6 }));
});

test('async', async ({ deepEqual, throwsAsync }) => {
	const buffer = new Uint8Array([0x31, 0x32, 0x33, 0x00, 0x61, 0x62, 0x63]);

	let offset = 0;

	// eslint-disable-next-line @typescript-eslint/require-await
	const advanceOffset = async (value: number) => {
		offset += value;
		return {
			buffer: buffer.subarray(offset, offset + 2),
			offset: 0,
		};
	};

	const readDefault = stringReader(Encoding.ASCII);

	deepEqual(await readDefault.async({ buffer: buffer.subarray(0, 2), offset: 0 }, advanceOffset), {
		value: '123',
		source: buffer.subarray(0, 4),
	});

	deepEqual(await readDefault.async({ buffer: buffer.subarray(4, 6), offset: 0 }, advanceOffset), {
		value: 'abc',
		source: buffer.subarray(4, 7),
	});

	offset = 0;

	const readCustom = stringReader(Encoding.ASCII, { terminator: '3' });

	deepEqual(await readCustom.async({ buffer: buffer.subarray(0, 2), offset: 0 }, advanceOffset), {
		value: '12',
		source: buffer.subarray(0, 3),
	});

	deepEqual(await readCustom.async({ buffer: buffer.subarray(3, 5), offset: 0 }, advanceOffset), {
		value: '\0abc',
		source: buffer.subarray(3, 7),
	});

	offset = 0;

	const readCount = stringReader(Encoding.ASCII, { count: 2 });

	deepEqual(await readCount.async({ buffer: buffer.subarray(0, 2), offset: 0 }, advanceOffset), {
		value: '12',
		source: buffer.subarray(0, 2),
	});

	deepEqual(await readCount.async({ buffer: buffer.subarray(2, 4), offset: 0 }, advanceOffset), {
		value: '3\0',
		source: buffer.subarray(2, 4),
	});

	deepEqual(await readCount.async({ buffer: buffer.subarray(4, 6), offset: 0 }, advanceOffset), {
		value: 'ab',
		source: buffer.subarray(4, 6),
	});

	await throwsAsync(async () => readCount.async({ buffer: buffer.subarray(6, 7), offset: 0 }, advanceOffset));
});
