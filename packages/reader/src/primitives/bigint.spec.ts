import test from 'ava';

import { ByteOrder } from '../byte-order.js';
import { ReadError } from '../read-error.js';
import { bigintReader, errorMessage } from './bigint.js';

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

test('uint big endian', ({ deepEqual }) => {
	const bytes = (value: bigint) => byteList(value, false, ByteOrder.BigEndian);

	const buffer = new Uint8Array([
		...bytes(0x12n),
		...bytes(0x12_34_56_78_9a_bc_de_f0n),
		...bytes(0x12_34_56_78_9a_bc_de_ff_ed_cb_a9_87_65_43_21n),
	]);

	const read = (offset: number, byteLength: number) => {
		return bigintReader({ signed: false, byteLength })({ buffer, offset, byteOrder: ByteOrder.BigEndian });
	};

	deepEqual(read(0, 1), {
		value: 0x12n,
		source: buffer.subarray(0, 1),
	});

	deepEqual(read(1, 8), {
		value: 0x12_34_56_78_9a_bc_de_f0n,
		source: buffer.subarray(1, 9),
	});

	deepEqual(read(9, 15), {
		value: 0x12_34_56_78_9a_bc_de_ff_ed_cb_a9_87_65_43_21n,
		source: buffer.subarray(9, 24),
	});
});

test('uint little endian', ({ deepEqual }) => {
	const bytes = (value: bigint) => byteList(value, false, ByteOrder.LittleEndian);

	const buffer = new Uint8Array([
		...bytes(0x12n),
		...bytes(0x12_34_56_78_9a_bc_de_f0n),
		...bytes(0x12_34_56_78_9a_bc_de_ff_ed_cb_a9_87_65_43_21n),
	]);

	const read = (offset: number, byteLength: number) => {
		return bigintReader({ signed: false, byteLength })({ buffer, offset, byteOrder: ByteOrder.LittleEndian });
	};

	deepEqual(read(0, 1), {
		value: 0x12n,
		source: buffer.subarray(0, 1),
	});

	deepEqual(read(1, 8), {
		value: 0x12_34_56_78_9a_bc_de_f0n,
		source: buffer.subarray(1, 9),
	});

	deepEqual(read(9, 15), {
		value: 0x12_34_56_78_9a_bc_de_ff_ed_cb_a9_87_65_43_21n,
		source: buffer.subarray(9, 24),
	});
});

test('int big endian', ({ deepEqual }) => {
	const bytes = (value: bigint) => byteList(value, true, ByteOrder.BigEndian);

	const buffer = new Uint8Array([
		...bytes(-0x12n),
		...bytes(-0x12_34_56_78_9a_bc_de_f0n),
		...bytes(-0x12_34_56_78_9a_bc_de_ff_ed_cb_a9_87_65_43_21n),
	]);

	const read = (offset: number, byteLength: number) => {
		return bigintReader({ signed: true, byteLength })({ buffer, offset, byteOrder: ByteOrder.BigEndian });
	};

	deepEqual(read(0, 1), {
		value: -0x12n,
		source: buffer.subarray(0, 1),
	});

	deepEqual(read(1, 8), {
		value: -0x12_34_56_78_9a_bc_de_f0n,
		source: buffer.subarray(1, 9),
	});

	deepEqual(read(9, 15), {
		value: -0x12_34_56_78_9a_bc_de_ff_ed_cb_a9_87_65_43_21n,
		source: buffer.subarray(9, 24),
	});
});

test('int little endian', ({ deepEqual }) => {
	const bytes = (value: bigint) => byteList(value, true, ByteOrder.LittleEndian);

	const buffer = new Uint8Array([
		...bytes(-0x12n),
		...bytes(-0x12_34_56_78_9a_bc_de_f0n),
		...bytes(-0x12_34_56_78_9a_bc_de_ff_ed_cb_a9_87_65_43_21n),
	]);

	const read = (offset: number, byteLength: number) => {
		return bigintReader({ signed: true, byteLength })({ buffer, offset, byteOrder: ByteOrder.LittleEndian });
	};

	deepEqual(read(0, 1), {
		value: -0x12n,
		source: buffer.subarray(0, 1),
	});

	deepEqual(read(1, 8), {
		value: -0x12_34_56_78_9a_bc_de_f0n,
		source: buffer.subarray(1, 9),
	});

	deepEqual(read(9, 15), {
		value: -0x12_34_56_78_9a_bc_de_ff_ed_cb_a9_87_65_43_21n,
		source: buffer.subarray(9, 24),
	});
});

test('mixed endianness', ({ deepEqual }) => {
	const buffer = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

	const read = bigintReader({ signed: false, byteLength: 2 });

	deepEqual(read({ buffer, offset: 0, byteOrder: ByteOrder.BigEndian }), {
		value: 0x1234n,
		source: buffer.subarray(0, 2),
	});

	deepEqual(read({ buffer, offset: 2, byteOrder: ByteOrder.LittleEndian }), {
		value: 0x7856n,
		source: buffer.subarray(2, 4),
	});
});

test('byte order precedence', ({ deepEqual }) => {
	const buffer = new Uint8Array([0x00, 0x01]);

	const read = bigintReader({ signed: false, byteLength: 2 }, ByteOrder.LittleEndian);

	deepEqual(read({ buffer, offset: 0, byteOrder: ByteOrder.BigEndian }), {
		value: 0x100n,
		source: buffer.subarray(),
	});
});

test('no byte order', ({ deepEqual, throws }) => {
	const buffer = new Uint8Array([0, 0]);

	deepEqual(bigintReader({ signed: false, byteLength: 1 })({ buffer, offset: 0 }), {
		value: 0n,
		source: buffer.subarray(0, 1),
	});

	deepEqual(
		throws(() => bigintReader({ signed: false, byteLength: 2 })({ buffer, offset: 0 })),
		new ReadError(errorMessage.noByteOrder(), buffer.subarray()),
	);
});

test('incomplete buffer', ({ deepEqual, throws }) => {
	const buffer = new Uint8Array([0]);

	deepEqual(
		throws(() =>
			bigintReader({ signed: false, byteLength: 2 })({
				buffer,
				offset: 0,
				byteOrder: ByteOrder.BigEndian,
			}),
		),
		new ReadError(errorMessage.unexpectedBufferEnd(2, 0), buffer.subarray()),
	);
});
