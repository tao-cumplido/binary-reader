import { Enum } from '@nishin/enum';

import type { Encoding } from './encoding.js';
import type { BigIntReaderInit } from './primitives/bigint.js';
import type { FloatReaderInit } from './primitives/float.js';
import type { IntReaderInit } from './primitives/int.js';
import type { StringReaderCountInit, StringReaderTerminatorInit } from './primitives/string.js';
import type {
	AsyncDataReader,
	AsyncDataReaderLike,
	DataReader,
	InternalDataReader,
	UniformReadonlyTuple,
} from './types.js';
import { assertInt } from './assert.js';
import { ByteOrder } from './byte-order.js';
import { arrayReader } from './primitives/array.js';
import { bigintReader } from './primitives/bigint.js';
import { booleanReader } from './primitives/boolean.js';
import { bytesReader } from './primitives/bytes.js';
import { charReader } from './primitives/char.js';
import { floatReader } from './primitives/float.js';
import { intReader } from './primitives/int.js';
import { stringReader } from './primitives/string.js';

const id = Symbol('DataType');

export class DataType<Value> extends Enum<'DataType', void>(id) {
	static readonly Boolean = new DataType(id, booleanReader());
	static readonly Uint8 = new DataType(id, intReader({ signed: false, byteLength: 1 }));
	static readonly Uint16 = new DataType(id, intReader({ signed: false, byteLength: 2 }));
	static readonly Uint32 = new DataType(id, intReader({ signed: false, byteLength: 4 }));
	static readonly Int8 = new DataType(id, intReader({ signed: true, byteLength: 1 }));
	static readonly Int16 = new DataType(id, intReader({ signed: true, byteLength: 2 }));
	static readonly Int32 = new DataType(id, intReader({ signed: true, byteLength: 4 }));
	static readonly BigUint64 = new DataType(id, bigintReader({ signed: false, byteLength: 8 }));
	static readonly BigInt64 = new DataType(id, bigintReader({ signed: true, byteLength: 8 }));
	static readonly Float32 = new DataType(id, floatReader({ byteLength: 4 }));
	static readonly Float64 = new DataType(id, floatReader({ byteLength: 8 }));

	static boolean(): DataReader<boolean> {
		return booleanReader();
	}

	static int({ signed, byteLength }: IntReaderInit, byteOrder?: ByteOrder): DataReader<number> {
		return intReader({ signed, byteLength }, byteOrder);
	}

	static bigint({ signed, byteLength }: BigIntReaderInit, byteOrder?: ByteOrder): DataReader<bigint> {
		return bigintReader({ signed, byteLength }, byteOrder);
	}

	static float({ byteLength }: FloatReaderInit, byteOrder?: ByteOrder): DataReader<number> {
		return floatReader({ byteLength }, byteOrder);
	}

	static char(encoding: Encoding, byteOrder?: ByteOrder): DataReader<string> {
		return charReader(encoding, byteOrder);
	}

	static bytes(count: number): InternalDataReader<Uint8Array> {
		return bytesReader(count);
	}

	static array<Value, Count extends number>(
		type: AsyncDataReaderLike<Value>,
		count: Count,
	): InternalDataReader<UniformReadonlyTuple<Value, Count>> {
		return arrayReader(type, count);
	}

	static string(
		encoding: Encoding,
		{ terminator }: StringReaderTerminatorInit,
		byteOrder?: ByteOrder,
	): InternalDataReader<string>;
	static string(encoding: Encoding, { count }: StringReaderCountInit, byteOrder?: ByteOrder): InternalDataReader<string>;
	static string(encoding: Encoding, byteOrder?: ByteOrder): InternalDataReader<string>;
	static string(
		encoding: Encoding,
		initOrByteOrder?: StringReaderTerminatorInit | StringReaderCountInit | ByteOrder,
		byteOrder?: ByteOrder,
	): InternalDataReader<string> {
		if (initOrByteOrder instanceof ByteOrder) {
			return stringReader(encoding, {}, initOrByteOrder);
		}

		if (initOrByteOrder && 'count' in initOrByteOrder) {
			assertInt(initOrByteOrder.count, { min: 0 });
		}

		return stringReader(encoding, initOrByteOrder, byteOrder);
	}

	readonly sync: DataReader<Value>;
	readonly async?: AsyncDataReader<Value>;
	readonly maxRequiredBytes?: number;

	constructor(check: symbol, reader: DataReader<Value> | InternalDataReader<Value>) {
		super(check);

		if (typeof reader === 'function') {
			this.sync = reader;
		} else {
			this.sync = reader.sync;
			this.async = reader.async;
		}

		this.maxRequiredBytes = reader.maxRequiredBytes;
	}
}
