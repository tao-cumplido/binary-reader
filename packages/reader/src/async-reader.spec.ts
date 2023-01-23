import test from 'ava';

import type { UpdateBuffer } from './async-reader.js';
import { AsyncReader } from './async-reader.js';
import { ByteOrder } from './byte-order.js';
import { DataType } from './data-type.js';
import { Encoding } from './encoding.js';
import { ReadMode } from './read-mode.js';

const updateBuffer =
	(buffer: Uint8Array): UpdateBuffer<Uint8Array> =>
	async ({ offset, size }) => {
		return Promise.resolve(buffer.subarray(offset, offset + size));
	};

test('seek', async ({ is, deepEqual, throwsAsync }) => {
	const buffer = new Uint8Array([0, 1, 2, 3, 4]);

	const reader = new AsyncReader(buffer.byteLength, updateBuffer(buffer), { bufferSize: 2 });

	await reader.seek(3);

	is(reader.offset, 3);
	is(reader.bufferStart, 3);
	deepEqual(await reader.getBuffer(), buffer.subarray(3, 5));

	await reader.seek(4);

	is(reader.offset, 4);
	is(reader.bufferStart, 3);
	deepEqual(await reader.getBuffer(), buffer.subarray(3, 5));

	deepEqual(await reader.next(DataType.Uint8, ReadMode.Source), {
		value: 4,
		source: buffer.subarray(4, 5),
	});

	is(reader.offset, 5);
	is(reader.bufferStart, 5);
	deepEqual(await reader.getBuffer(), buffer.subarray(5));

	await reader.seek(2);

	is(reader.offset, 2);
	is(reader.bufferStart, 2);
	deepEqual(await reader.getBuffer(), buffer.subarray(2, 4));

	await reader.seek(4);

	is(reader.offset, 4);
	is(reader.bufferStart, 4);
	deepEqual(await reader.getBuffer(), buffer.subarray(4, 5));

	await reader.seek(0);

	is(reader.offset, 0);
	is(reader.bufferStart, 0);
	deepEqual(await reader.getBuffer(), buffer.subarray(0, 2));

	await reader.seek(5);

	is(reader.offset, 5);
	is(reader.bufferStart, 5);
	deepEqual(await reader.getBuffer(), buffer.subarray(5));

	await throwsAsync(reader.seek(6));
});

test('next', async ({ deepEqual, is, throwsAsync }) => {
	const buffer = new Uint8Array([0x30, 0x31, 0x32, 0x33, 0x00, 0xe3]);

	const reader = new AsyncReader(buffer.byteLength, updateBuffer(buffer), ByteOrder.BigEndian, {
		bufferSize: 2,
	});

	deepEqual(await reader.next(DataType.array(DataType.Uint8, 4), ReadMode.Source), {
		value: [0x30, 0x31, 0x32, 0x33],
		source: buffer.subarray(0, 4),
	});

	is(reader.offset, 4);
	deepEqual(await reader.getBuffer(), buffer.subarray(4, 6));

	await reader.seek(0);

	deepEqual(await reader.next(DataType.string(Encoding.ASCII), ReadMode.Source), {
		value: '0123',
		source: buffer.subarray(0, 5),
	});

	is(reader.offset, 5);
	deepEqual(await reader.getBuffer(), buffer.subarray(4, 6));

	await reader.seek(0);

	deepEqual(
		await reader.next(
			{
				// eslint-disable-next-line @typescript-eslint/no-shadow
				async: async ({ buffer, offset, byteOrder }, advanceOffset) => {
					const string = await DataType.string(Encoding.ASCII, { count: 2 }).async({ buffer, offset }, advanceOffset);
					({ buffer, offset } = await advanceOffset(0));

					const uint16 = DataType.Uint16.sync({ buffer, offset, byteOrder });
					await advanceOffset(2);

					const source = new Uint8Array(string.source.byteLength + uint16.source.byteLength);

					source.set(string.source, 0);
					source.set(uint16.source, string.source.byteLength);

					return {
						value: [string.value, uint16.value],
						source,
					};
				},
			},
			ReadMode.Source,
		),
		{
			value: ['01', 0x3233],
			source: buffer.subarray(0, 4),
		},
	);

	is(reader.offset, 4);

	await reader.skip(1);

	is(reader.offset, 5);

	await throwsAsync(reader.next(DataType.char(Encoding.UTF8)));

	is(reader.offset, 5);

	deepEqual(await reader.next(DataType.Uint8, ReadMode.Source), {
		value: 0xe3,
		source: buffer.subarray(5, 6),
	});

	is(reader.offset, 6);
});
