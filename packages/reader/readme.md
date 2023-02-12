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
- ISO 8859-1
- UTF-8
- UTF-16
- UTF-32

Note that for UTF-16 and UTF-32 the byte order is relevant.

In most cases reading more than one byte requires a byte order to be set. The byte order can be set on the reader instance or on the data type provided to the `next()` method, the order on the data type takes precedence over the instance one. With `ReadMode.Source`, the `next()` method returns an object of the form `{ value: T, source: Uint8Array }`, where `source` is the bytes the value was read from. While in many cases the number of bytes to read is known beforehand, this is not always the case. For example one character of text in UTF-8 encoding can be between 1 and 4 bytes long.

## Basic usage

```js
import assert from 'node:assert';

import { BinaryReader, DataType, ByteOrder } from '@nishin/reader';

const reader = new BinaryReader(new Uint8Array([0x00, 0x42]), ByteOrder.BigEndian);

// use one of the static factory methods to create a data reader object
assert.equal(
	reader.next(DataType.int({ signed: false, byteLength: 1 })),
	0,
);

// or use one of the enum-like values for common data types
assert.equal(
	reader.next(DataType.Uint8),
	0x42,
);

reader.seek(0); // reset current offset to beginning
assert.equal(
	reader.next(DataType.Uint16),
	0x42,
);

reader.seek(0);
assert.equal(
	// use explicit byte order on the data type
	reader.next(DataType.int({ signed: false, byteLength: 2 }, ByteOrder.LittleEndian)),
	0x4200,
);
```

See the source files for [`BinaryReader`](src/binary-reader.ts) and [`DataType`](src/data-type.ts) for a more complete overview of the API capabilities.

## Streaming

The package provides an `AsyncReader` class that provides a similiar interface as the synchronous `BinaryReader` but allows to only hold parts of the source data in memory at a given time. The `@nishin/node-file-reader` package implements an access layer on top of `AsyncReader` to be able to read files of arbitrary size. `AsyncReader` itself is platform independent and could also receive updates from an API endpoint.

## Custom data types

The built-in types accessed through `DataType` are just low-level primitives for reading data from a given buffer. These primitives are simple functions that are passed a buffer, an offset and a byte order. In TypeScript the basic definition is as follows

```ts
interface BytesValue<T> {
	readonly value: T;
	readonly source: Uint8Array;
}

interface DataReaderState {
	readonly buffer: Uint8Array;
	readonly offset: number;
	readonly byteOrder?: ByteOrder;
}

type DataReader<Value> = (state: DataReaderState) => BytesValue<Value>;
```

Custom data types can be passed to the `next()` method of a `BinaryReader` instance and can be used to read blocks of data like structs. The built-in types can give an idea of how to implement such a method. Note that some implementations are a bit more complex since they need to differentiate between synchronous and asynchronous access. Asynchronous access is more complex and is still lacking documentation.

Custom encodings can be implemented in a similar fashion. See the sources for examples.

[npm-image]: https://img.shields.io/npm/v/@nishin/reader.svg
[npm-url]: https://npmjs.org/package/@nishin/reader
