/* eslint-disable @typescript-eslint/naming-convention */

import test from 'ava';

import { BinaryReader } from './binary-reader.js';
import { ByteOrder } from './byte-order.js';
import { DataType } from './data/data-type.js';
import { Encoding } from './encoding.js';
import { ReadError } from './read-error.js';

function byteList(value: number | bigint, signed: boolean, byteOrder: ByteOrder) {
	const hex = (() => {
		if (signed) {
			const absValue = value < 0 ? (typeof value === 'number' ? value * -1 : value * -1n) : value;
			const bits = Math.ceil(absValue.toString(16).length / 2) * 8;
			return BigInt.asUintN(bits, BigInt(value)).toString(16);
		}

		return value.toString(16);
	})();

	const bytes = hex
		.padStart(Math.ceil(hex.length / 2) * 2, '0')
		.split(/(?<=^(?:.{2})+)(?!$)/u)
		.map((byte) => parseInt(byte, 16));

	return byteOrder === ByteOrder.LittleEndian ? bytes.reverse() : bytes;
}

const uintBytesBE = (value: number | bigint) => byteList(value, false, ByteOrder.BigEndian);
const uintBytesLE = (value: number | bigint) => byteList(value, false, ByteOrder.LittleEndian);
const intBytesBE = (value: number | bigint) => byteList(value, true, ByteOrder.BigEndian);
const intBytesLE = (value: number | bigint) => byteList(value, true, ByteOrder.LittleEndian);

test('boolean', ({ deepEqual }) => {
	const reader = new BinaryReader(new Uint8Array([0, 1, 2]));
	deepEqual(reader.next(DataType.Boolean), { value: false, byteLength: 1 });
	deepEqual(reader.next(DataType.Boolean), { value: true, byteLength: 1 });
	deepEqual(reader.next(DataType.Boolean), { value: true, byteLength: 1 });
});

test('uint little endian', ({ deepEqual }) => {
	const reader = new BinaryReader(
		new Uint8Array([
			...uintBytesLE(0x12),
			...uintBytesLE(0x12_34),
			...uintBytesLE(0x12_34_56),
			...uintBytesLE(0x12_34_56_78),
			...uintBytesLE(0x12_34_56_78_9a),
			...uintBytesLE(0x12_34_56_78_9a_bc),
		]),
		ByteOrder.LittleEndian,
	);

	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 1 })), { value: 0x12, byteLength: 1 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 2 })), { value: 0x12_34, byteLength: 2 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 3 })), { value: 0x12_34_56, byteLength: 3 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 4 })), { value: 0x12_34_56_78, byteLength: 4 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 5 })), { value: 0x12_34_56_78_9a, byteLength: 5 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 6 })), {
		value: 0x12_34_56_78_9a_bc,
		byteLength: 6,
	});
});

test('uint big endian', ({ deepEqual }) => {
	const reader = new BinaryReader(
		new Uint8Array([
			...uintBytesBE(0x12),
			...uintBytesBE(0x12_34),
			...uintBytesBE(0x12_34_56),
			...uintBytesBE(0x12_34_56_78),
			...uintBytesBE(0x12_34_56_78_9a),
			...uintBytesBE(0x12_34_56_78_9a_bc),
		]),
		ByteOrder.BigEndian,
	);

	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 1 })), { value: 0x12, byteLength: 1 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 2 })), { value: 0x12_34, byteLength: 2 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 3 })), { value: 0x12_34_56, byteLength: 3 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 4 })), { value: 0x12_34_56_78, byteLength: 4 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 5 })), { value: 0x12_34_56_78_9a, byteLength: 5 });
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 6 })), {
		value: 0x12_34_56_78_9a_bc,
		byteLength: 6,
	});
});

test('int little endian', ({ deepEqual }) => {
	const reader = new BinaryReader(
		new Uint8Array([
			...intBytesLE(-0x12),
			...intBytesLE(-0x12_34),
			...intBytesLE(-0x12_34_56),
			...intBytesLE(-0x12_34_56_78),
			...intBytesLE(-0x12_34_56_78_9a),
			...intBytesLE(-0x12_34_56_78_9a_bc),
		]),
		ByteOrder.LittleEndian,
	);

	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 1 })), { value: -0x12, byteLength: 1 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 2 })), { value: -0x12_34, byteLength: 2 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 3 })), { value: -0x12_34_56, byteLength: 3 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 4 })), { value: -0x12_34_56_78, byteLength: 4 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 5 })), { value: -0x12_34_56_78_9a, byteLength: 5 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 6 })), {
		value: -0x12_34_56_78_9a_bc,
		byteLength: 6,
	});
});

test('int big endian', ({ deepEqual }) => {
	const reader = new BinaryReader(
		new Uint8Array([
			...intBytesBE(-0x12),
			...intBytesBE(-0x12_34),
			...intBytesBE(-0x12_34_56),
			...intBytesBE(-0x12_34_56_78),
			...intBytesBE(-0x12_34_56_78_9a),
			...intBytesBE(-0x12_34_56_78_9a_bc),
		]),
		ByteOrder.BigEndian,
	);

	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 1 })), { value: -0x12, byteLength: 1 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 2 })), { value: -0x12_34, byteLength: 2 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 3 })), { value: -0x12_34_56, byteLength: 3 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 4 })), { value: -0x12_34_56_78, byteLength: 4 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 5 })), { value: -0x12_34_56_78_9a, byteLength: 5 });
	deepEqual(reader.next(DataType.int({ signed: true, byteLength: 6 })), {
		value: -0x12_34_56_78_9a_bc,
		byteLength: 6,
	});
});

test('biguint little endian', ({ deepEqual }) => {
	const reader = new BinaryReader(
		new Uint8Array([
			...uintBytesLE(0x12n),
			...uintBytesLE(0x12_34_56_78_9a_bc_den),
			...uintBytesLE(0x12_34_56_78_9a_bc_de_f0n),
			...uintBytesLE(0x12_34_56_78_9a_bc_de_f0_12_34_56_78_9a_bc_de_f0n),
		]),
		ByteOrder.LittleEndian,
	);

	deepEqual(reader.next(DataType.bigint({ signed: false, byteLength: 1 })), { value: 0x12n, byteLength: 1 });
	deepEqual(reader.next(DataType.bigint({ signed: false, byteLength: 7 })), {
		value: 0x12_34_56_78_9a_bc_den,
		byteLength: 7,
	});
	deepEqual(reader.next(DataType.bigint({ signed: false, byteLength: 8 })), {
		value: 0x12_34_56_78_9a_bc_de_f0n,
		byteLength: 8,
	});
	deepEqual(reader.next(DataType.bigint({ signed: false, byteLength: 16 })), {
		value: 0x12_34_56_78_9a_bc_de_f0_12_34_56_78_9a_bc_de_f0n,
		byteLength: 16,
	});
});

test('biguint big endian', ({ deepEqual }) => {
	const reader = new BinaryReader(
		new Uint8Array([
			...uintBytesBE(0x12n),
			...uintBytesBE(0x12_34_56_78_9a_bc_den),
			...uintBytesBE(0x12_34_56_78_9a_bc_de_f0n),
			...uintBytesBE(0x12_34_56_78_9a_bc_de_f0_12_34_56_78_9a_bc_de_f0n),
		]),
		ByteOrder.BigEndian,
	);

	deepEqual(reader.next(DataType.bigint({ signed: false, byteLength: 1 })), { value: 0x12n, byteLength: 1 });
	deepEqual(reader.next(DataType.bigint({ signed: false, byteLength: 7 })), {
		value: 0x12_34_56_78_9a_bc_den,
		byteLength: 7,
	});
	deepEqual(reader.next(DataType.bigint({ signed: false, byteLength: 8 })), {
		value: 0x12_34_56_78_9a_bc_de_f0n,
		byteLength: 8,
	});
	deepEqual(reader.next(DataType.bigint({ signed: false, byteLength: 16 })), {
		value: 0x12_34_56_78_9a_bc_de_f0_12_34_56_78_9a_bc_de_f0n,
		byteLength: 16,
	});
});

test('bigint little endian', ({ deepEqual }) => {
	const reader = new BinaryReader(
		new Uint8Array([
			...intBytesLE(-0x12n),
			...intBytesLE(-0x12_34_56_78_9a_bc_den),
			...intBytesLE(-0x12_34_56_78_9a_bc_de_f0n),
			...intBytesLE(-0x12_34_56_78_9a_bc_de_f0_12_34_56_78_9a_bc_de_f0n),
		]),
		ByteOrder.LittleEndian,
	);

	deepEqual(reader.next(DataType.bigint({ signed: true, byteLength: 1 })), { value: -0x12n, byteLength: 1 });
	deepEqual(reader.next(DataType.bigint({ signed: true, byteLength: 7 })), {
		value: -0x12_34_56_78_9a_bc_den,
		byteLength: 7,
	});
	deepEqual(reader.next(DataType.bigint({ signed: true, byteLength: 8 })), {
		value: -0x12_34_56_78_9a_bc_de_f0n,
		byteLength: 8,
	});
	deepEqual(reader.next(DataType.bigint({ signed: true, byteLength: 16 })), {
		value: -0x12_34_56_78_9a_bc_de_f0_12_34_56_78_9a_bc_de_f0n,
		byteLength: 16,
	});
});

test('bigint big endian', ({ deepEqual }) => {
	const reader = new BinaryReader(
		new Uint8Array([
			...intBytesBE(-0x12n),
			...intBytesBE(-0x12_34_56_78_9a_bc_den),
			...intBytesBE(-0x12_34_56_78_9a_bc_de_f0n),
			...intBytesBE(-0x12_34_56_78_9a_bc_de_f0_12_34_56_78_9a_bc_de_f0n),
		]),
		ByteOrder.BigEndian,
	);

	deepEqual(reader.next(DataType.bigint({ signed: true, byteLength: 1 })), { value: -0x12n, byteLength: 1 });
	deepEqual(reader.next(DataType.bigint({ signed: true, byteLength: 7 })), {
		value: -0x12_34_56_78_9a_bc_den,
		byteLength: 7,
	});
	deepEqual(reader.next(DataType.bigint({ signed: true, byteLength: 8 })), {
		value: -0x12_34_56_78_9a_bc_de_f0n,
		byteLength: 8,
	});
	deepEqual(reader.next(DataType.bigint({ signed: true, byteLength: 16 })), {
		value: -0x12_34_56_78_9a_bc_de_f0_12_34_56_78_9a_bc_de_f0n,
		byteLength: 16,
	});
});

test('int mixed endianness', ({ deepEqual }) => {
	const reader = new BinaryReader(new Uint8Array([...uintBytesBE(0x1234), ...uintBytesLE(0x1234)]));

	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 2 }, ByteOrder.BigEndian)), {
		value: 0x1234,
		byteLength: 2,
	});
	deepEqual(reader.next(DataType.int({ signed: false, byteLength: 2 }, ByteOrder.LittleEndian)), {
		value: 0x1234,
		byteLength: 2,
	});
});

test('int out of bounds', ({ deepEqual, is, throws }) => {
	const reader = new BinaryReader(new Uint8Array([0x00]), ByteOrder.BigEndian);
	const error = throws<ReadError>(() => reader.next(DataType.Uint16), { instanceOf: ReadError });
	deepEqual(error?.bytes, reader.buffer);
	is(reader.offset, 0);
});

test('float little endian', ({ deepEqual }) => {
	const view = new DataView(new ArrayBuffer(24));
	const reader = new BinaryReader(new Uint8Array(view.buffer), ByteOrder.LittleEndian);

	view.setFloat32(0, 1 / 2 ** 6, true);
	view.setFloat32(4, -1 / 2 ** 6, true);
	view.setFloat64(8, 1 / 2 ** 15, true);
	view.setFloat64(16, -1 / 2 ** 15, true);

	deepEqual(reader.next(DataType.Float32), { value: 1 / 2 ** 6, byteLength: 4 });
	deepEqual(reader.next(DataType.Float32), { value: -1 / 2 ** 6, byteLength: 4 });
	deepEqual(reader.next(DataType.Float64), { value: 1 / 2 ** 15, byteLength: 8 });
	deepEqual(reader.next(DataType.Float64), { value: -1 / 2 ** 15, byteLength: 8 });
});

test('float big endian', ({ deepEqual }) => {
	const view = new DataView(new ArrayBuffer(24));
	const reader = new BinaryReader(new Uint8Array(view.buffer), ByteOrder.BigEndian);

	view.setFloat32(0, 1 / 2 ** 6, false);
	view.setFloat32(4, -1 / 2 ** 6, false);
	view.setFloat64(8, 1 / 2 ** 15, false);
	view.setFloat64(16, -1 / 2 ** 15, false);

	deepEqual(reader.next(DataType.Float32), { value: 1 / 2 ** 6, byteLength: 4 });
	deepEqual(reader.next(DataType.Float32), { value: -1 / 2 ** 6, byteLength: 4 });
	deepEqual(reader.next(DataType.Float64), { value: 1 / 2 ** 15, byteLength: 8 });
	deepEqual(reader.next(DataType.Float64), { value: -1 / 2 ** 15, byteLength: 8 });
});

test('string', ({ deepEqual, throws }) => {
	const ascii = DataType.string(Encoding.ASCII);

	const reader = new BinaryReader(new Uint8Array([0x31, 0x32, 0x33, 0x00, 0x61, 0x62, 0x63]));

	deepEqual(reader.next(ascii), { value: '123', byteLength: 4 });
	deepEqual(reader.next(ascii), { value: 'abc', byteLength: 3 });

	reader.seek(0);

	const asciiTerminate3 = DataType.string(Encoding.ASCII, { terminator: '3' });

	deepEqual(reader.next(asciiTerminate3), { value: '12', byteLength: 3 });
	deepEqual(reader.next(asciiTerminate3), { value: '\0abc', byteLength: 4 });

	reader.seek(0);

	const asciiCount2 = DataType.string(Encoding.ASCII, { count: 2 });

	deepEqual(reader.next(asciiCount2), { value: '12', byteLength: 2 });
	deepEqual(reader.next(asciiCount2), { value: '3\0', byteLength: 2 });
	deepEqual(reader.next(asciiCount2), { value: 'ab', byteLength: 2 });
	throws(() => reader.next(asciiCount2));

	throws(() => new BinaryReader(new Uint8Array([0xe0, 0xa0])).next(DataType.string(Encoding.UTF8)));
});

test('array', ({ deepEqual }) => {
	const reader = new BinaryReader(new Uint8Array([0x00, 0x01, 0x31, 0x32]));
	deepEqual(reader.next(DataType.array(DataType.Uint8, 2)), { value: [0, 1], byteLength: 2 });
	deepEqual(reader.next(DataType.array(DataType.char(Encoding.ASCII), 2)), { value: ['1', '2'], byteLength: 2 });
});

test('struct', ({ deepEqual }) => {
	const reader = new BinaryReader(new Uint8Array([...[0x00], ...[0x41, 0x42, 0x00], ...[0x12, 0x34]]));

	const struct = {
		boolean: DataType.Boolean,
		string: DataType.string(Encoding.ASCII),
		int: DataType.int({ signed: false, byteLength: 2 }, ByteOrder.BigEndian),
	};

	const expected = {
		boolean: { value: false, byteLength: 1 },
		string: { value: 'AB', byteLength: 3 },
		int: { value: 0x1234, byteLength: 2 },
	};

	deepEqual(reader.next(struct), expected);

	reader.seek(0);

	deepEqual(reader.next(Object.values(struct)), Object.values(expected));
});
