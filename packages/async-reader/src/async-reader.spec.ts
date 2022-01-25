import type { FileHandle } from 'fs/promises';

import test from 'ava';

import { ByteOrder, DataType, Encoding } from '@nishin/reader';

import { AsyncReader } from './async-reader.js';

function mockFileHandle(source: Uint8Array) {
	return {
		stat: async () => Promise.resolve({ size: source.length }),
		read: async ({ buffer = Buffer.alloc(0), length = 0, position = 0 }) => {
			const result = source.slice(position, position + length);
			buffer.fill(result);
			return Promise.resolve({ bytesRead: result.length });
		},
	} as unknown as FileHandle;
}

test('seek', async ({ deepEqual, throwsAsync }) => {
	const reader = new AsyncReader(mockFileHandle(new Uint8Array([0, 1, 2, 3, 4])), { bufferSize: 2 });

	await reader.seek(3);

	deepEqual(reader.buffer, Buffer.from([3, 4]));

	await reader.seek(4);

	deepEqual(reader.buffer, Buffer.from([3, 4]));

	await reader.seek(2);

	deepEqual(reader.buffer, Buffer.from([2, 3]));

	await reader.seek(4);

	deepEqual(reader.buffer, Buffer.from([4]));

	await reader.seek(0);

	deepEqual(reader.buffer, Buffer.from([0, 1]));

	await throwsAsync(reader.seek(5));
});

test('next', async ({ deepEqual, throwsAsync }) => {
	const reader = new AsyncReader(
		mockFileHandle(new Uint8Array([0x30, 0x31, 0x32, 0x33, 0x00, 0xe3])),
		ByteOrder.BigEndian,
		{
			bufferSize: 2,
		},
	);

	deepEqual(await reader.next(DataType.array(DataType.Uint8, 4)), {
		value: [0x30, 0x31, 0x32, 0x33],
		byteLength: 4,
	});

	await reader.seek(0);

	deepEqual(await reader.next(DataType.string(Encoding.ASCII)), { value: '0123', byteLength: 5 });

	await reader.seek(0);

	deepEqual(await reader.next([DataType.string(Encoding.ASCII, { count: 2 }), DataType.Uint16]), [
		{ value: '01', byteLength: 2 },
		{ value: 0x3233, byteLength: 2 },
	]);

	await reader.seek(0);

	deepEqual(
		await reader.next({
			a: DataType.string(Encoding.ASCII, { terminator: '1' }),
			b: DataType.int({ signed: false, byteLength: 2 }, ByteOrder.LittleEndian),
		}),
		{
			a: { value: '0', byteLength: 2 },
			b: { value: 0x3332, byteLength: 2 },
		},
	);

	await reader.skip(1);

	await throwsAsync(reader.next(DataType.char(Encoding.UTF8)));
});
