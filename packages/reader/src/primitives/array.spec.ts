import test from 'ava';

import { ReadError } from '../read-error.js';
import { arrayReader, errorMessage } from './array.js';
import { intReader } from './int.js';

const uint8 = intReader({ signed: false, byteLength: 1 });

test('sync', ({ deepEqual }) => {
	const buffer = new Uint8Array([0, 1, 2, 3]);
	const read = arrayReader(uint8, 2);

	deepEqual(read.sync({ buffer, offset: 0 }), {
		value: [0, 1],
		source: buffer.subarray(0, 2),
	});

	deepEqual(read.sync({ buffer, offset: 2 }), {
		value: [2, 3],
		source: buffer.subarray(2, 4),
	});
});

test('async with sync type', async ({ deepEqual }) => {
	const buffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

	let offset = 0;

	// eslint-disable-next-line @typescript-eslint/require-await
	const advanceOffset = async (value: number) => {
		offset += value;
		return {
			buffer: buffer.subarray(offset, offset + 2),
			offset: 0,
		};
	};

	const read = arrayReader(uint8, 4);

	deepEqual(await read.async({ buffer: buffer.subarray(0, 2), offset: 0 }, advanceOffset), {
		value: [0, 1, 2, 3],
		source: buffer.subarray(0, 4),
	});

	deepEqual(await read.async({ buffer: buffer.subarray(4, 6), offset: 0 }, advanceOffset), {
		value: [4, 5, 6, 7],
		source: buffer.subarray(4, 8),
	});
});

test('async with async type', async ({ deepEqual }) => {
	const buffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

	let offset = 0;

	// eslint-disable-next-line @typescript-eslint/require-await
	const advanceOffset = async (value: number) => {
		offset += value;
		return {
			buffer: buffer.subarray(offset, offset + 2),
			offset: 0,
		};
	};

	const read = arrayReader(arrayReader(uint8, 2), 2);

	deepEqual(await read.async({ buffer: buffer.subarray(0, 2), offset: 0 }, advanceOffset), {
		value: [
			[0, 1],
			[2, 3],
		],
		source: buffer.subarray(0, 4),
	});

	deepEqual(await read.async({ buffer: buffer.subarray(4, 6), offset: 0 }, advanceOffset), {
		value: [
			[4, 5],
			[6, 7],
		],
		source: buffer.subarray(4, 8),
	});
});

test('errors', async ({ throws, throwsAsync }) => {
	throws(
		() => {
			const read = arrayReader({ async: async () => Promise.resolve({ value: 0, source: new Uint8Array() }) }, 1);
			read.sync({ buffer: new Uint8Array(), offset: 0 });
		},
		{
			instanceOf: ReadError,
			message: errorMessage.missingSyncRead(),
		},
	);

	await throwsAsync(
		async () => {
			// @ts-expect-error
			const read = arrayReader({}, 1);
			const state = { buffer: new Uint8Array(), offset: 0 };
			await read.async(state, async () => Promise.resolve(state));
		},
		{
			instanceOf: ReadError,
			message: errorMessage.missingAsyncRead(),
		},
	);
});
