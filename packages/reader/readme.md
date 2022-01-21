# Binary reader for JavaScript

> Read various data types from a byte array in a streamlined way

[![NPM Version][npm-image]][npm-url]

The `BinaryReader` class wraps an `Uint8Array` and provides a convenient access layer to the underlying data. By calling the `next()` method with a specified data type, the underlying data will be read into an appropriate JavaScript value. The reader keeps track of the current position, which can also be manually adjusted.

These data types are currently supported:

- Boolean: reads one byte into a JavaScript `boolean`, zero is `false` and positive values are `true`
- Signed or unsigned integer: reads up to six bytes into a JavaScript `number`
- Signed or unsigned bigints: reads an arbitrary number of bytes into a JavaScript `bigint`
- Single and double precision floats: reads 4 or 8 bytes into a JavaScript `number`
- Single text characters: encoding dependent multibyte sequences read into a JavaScript `string`
- String of text characters: can be either null-terminated (default), terminated by another character or a fixed number of characters. Terminated strings are also automatically terminated by the end of the buffer.
- Fixed-length arrays of one of the above types

The following encodings are currently supported for text characters and strings:

- ASCII
- UTF-8
- UTF-16
- UTF-32

Note that for UTF-16 and UTF-32 the byte order is relevant.

In most cases reading more than one byte requires a byte order to be set. The byte order can be set on the reader instance or on the data type provided to the `next()` method, the order on the data type takes precedence over the instance one. For consistency, the `next()` method always returns an object of the form `{ value: T, byteLength: number }`. While in many cases the number of bytes to read is known beforehand, this is not always the case. For example one character of text in UTF-8 encoding can be between 1 and 4 bytes.

## Installation

```sh
npm install @nishin/reader
```

## Usage

```js
import assert from 'node:assert';

import { BinaryReader, DataType, ByteOrder, Encoding } from '@nishin/reader';

const reader = new BinaryReader(new Uint8Array([0x00, 0x42]), ByteOrder.BigEndian);

// use one of the static methods to create a DataType instance to read
assert.deepEqual(
	reader.next(DataType.int({ signed: false, byteLength: 1 })),
	{ value: 0, byteLength: 1 },
);

// or use one of the enum-like values for common data types
assert.deepEqual(
	reader.next(DataType.Uint8),
	{ value: 0x42, byteLength: 1 },
);

reader.seek(0); // reset current offset to beginning
assert.deepEqual(
	reader.next(DataType.Uint16),
	{ value: 0x42, byteLength: 2 },
);

reader.seek(0);
assert.deepEqual(
	// use explicit byte order on the data type
	reader.next(DataType.int({ signed: false, byteLength: 2 }, ByteOrder.LittleEndian)),
	{ value: 0x4200, byteLength: 2 },
);

// you can also pass arrays or records of data types to read packed data like a struct
reader.seek(0);
assert.deepEqual(
	reader.next([DataType.Uint8, DataType.char(Encoding.ASCII)]),
	[{ value: 0, byteLength: 1 }, { value: 'B', byteLength: 1 }],
);

reader.seek(0);
assert.deepEqual(
	reader.next({ a: DataType.Uint8, b: DataType.char(Encoding.ASCII) }),
	{ a: { value: 0, byteLength: 1 }, b: { value: 'B', byteLength: 1 } },
);

```

## API
The API is written here in a quasi-declarative TypeScript way. Some implementation details are simplified here because they don't matter for using the library.

```ts
class ByteOrder extends Enum<number> {
	static readonly BigEndian: ByteOrder;
	static readonly LittleEndian: ByteOrder;
}

class Encoding extends Enum {
	static readonly ASCII: Encoding;
	static readonly UTF8: Encoding;
	static readonly UTF16: Encoding;
	static readonly UTF32: Encoding;
}

class DataType {
	static readonly Boolean = DataType.boolean();
	static readonly Uint8 = DataType.int({ signed: false, byteLength: 1 });
	static readonly Uint16 = DataType.int({ signed: false, byteLength: 2 });
	static readonly Uint32 = DataType.int({ signed: false, byteLength: 4 });
	static readonly Int8 = DataType.int({ signed: true, byteLength: 1 });
	static readonly Int16 = DataType.int({ signed: true, byteLength: 2 });
	static readonly Int32 = DataType.int({ signed: true, byteLength: 4 });
	static readonly BigUint64 = DataType.bigint({ signed: false, byteLength: 8 });
	static readonly BigInt64 = DataType.bigint({ signed: true, byteLength: 8 });
	static readonly Float32 = DataType.float({ byteLength: 4 });
	static readonly Float64 = DataType.float({ byteLength: 8 });

	static boolean(): DataBoolean;
	static int(config: { signed: boolean, byteLength: 1 | 2 | 3 | 4 | 5 | 6 }, byteOrder?: ByteOrder): DataInt;
	static bigint(config: { signed: boolean, byteLength: number }, byteOrder?: ByteOrder): DataBigInt;
	static float(config: { byteLength: 4 | 8 }, byteOrder?: ByteOrder): DataFloat;
	static char(encoding: Encoding, byteOrder?: ByteOrder): DataChar;
	static string(encoding: Encoding, config?: { terminator: string }, byteOrder?: ByteOrder): DataString;
	static string(encoding: Encoding, config?: { count: number }, byteOrder?: ByteOrder): DataString;
	static string(encoding: Encoding, byteOrder?: ByteOrder): DataString; // null terminated string
	static array<T extends DataType>(type: T, count: number): DataArray<T>;
}

interface DataValue<T> {
	readonly value: T;
	readonly byteLength: number;
}

class BinaryReader {
	readonly offset: number;
	readonly buffer: Uint8Array;
	readonly byteOrder?: ByteOrder;

	constructor(source: Uint8Array, byteOrder?: ByteOrder);

	setByteOrder(byteOrder: ByteOrder): void;

	/**
	 * Reads the byte order mark from the given offset and sets the byte order on the reader instance.
	 * Advances the read offset by 2 bytes on succes, throws an error otherwise.
	 */
	readByteOrderMark(offset = 0): void;

	/**
	 * Asserts that the source buffer contains the given magic in ASCII encoding or raw bytes at the given offset.
	 * Advances the read offset accordingly on succes, throws an error otherwise.
	 */ 
	assertMagic(magic: string | Uint8Array, offset = 0): void;

	/**
	 * Creates copy of the reader from the current read offset with the given size.
	 */
	slice(size: number): BinaryReader;

	/**
	 * Set the read offset.
	 */
	seek(offset: number): void;

	/**
	 * Advance the read offset by number of bytes given.
	 */
	skip(bytes: number): void;

	/**
	 * Align the read offset to the nearest multiple.
	 */
	align(to: number): void;

	/**
	 * Read the next value of the given type and advance the read offset by number of bytes processed. 
	 */
	next(type: DataBoolean): DataValue<boolean>;
	next(type: DataInt | DataFloat): DataValue<number>;
	next(type: DataBigInt): DataValue<bigint>;
	next(type: DataChar | DataString): DataValue<string>;
	next<T extends DataType>(type: DataArray<T>): DataValue<T[]>;
	next<T extends DataType[]>(struct: T): DataValue[];
	next<T extends Record<string, DataType>>(struct: T): Record<string, DataValue>;
}
```

[npm-image]: https://img.shields.io/npm/v/@nishin/reader.svg
[npm-url]: https://npmjs.org/package/@nishin/reader
