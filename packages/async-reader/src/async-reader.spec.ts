import fs from 'fs/promises';

import test from 'ava';

import { ByteOrder, DataType, Encoding } from '@nishin/reader';

import { AsyncReader } from './async-reader.js';

test('seek', async ({ deepEqual, throwsAsync }) => {
	const path = 'dist/seek';
	const handle = await fs.open(path, 'w+');

	await handle.writeFile(new Uint8Array([0, 1, 2, 3, 4]));

	const reader = new AsyncReader(handle, { bufferSize: 2 });

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

	await reader.seek(5);

	deepEqual(reader.buffer, Buffer.from([]));

	await throwsAsync(reader.seek(6));

	await reader.close();

	await fs.rm(path);
});

test('next', async ({ deepEqual, throwsAsync }) => {
	const path = 'dist/next';
	const handle = await fs.open(path, 'w+');

	await handle.writeFile(new Uint8Array([0x30, 0x31, 0x32, 0x33, 0x00, 0xe3]));

	const reader = new AsyncReader(handle, ByteOrder.BigEndian, {
		bufferSize: 2,
	});

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

	deepEqual(reader.offset, 5);

	deepEqual(await reader.next(DataType.Uint8), { value: 0xe3, byteLength: 1 });

	deepEqual(reader.offset, 6);

	await reader.close();

	await fs.rm(path);
});
