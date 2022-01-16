# Binary reader for JavaScript

> Read various data types from a byte array in a streamlined way

[![NPM Version][npm-image]][npm-url]

## Install

```sh
npm install @nishin/reader
```

## Usage

The `BinaryReader` class wraps an `Uint8Array` and provides a convenient access layer to the underlying data. By calling the `next()` method with a specified data type, the underlying data will be read into an appropriate JavaScript value. The reader keeps track of the current position, which can also be manually set.

These data types are currently supported:

- Boolean: reads one byte into a JavaScript `boolean`, zero is `false` and positive values are `true`
- Signed or unsigned integer: reads up to six bytes into a JavaScript `number`
- Signed or unsigned bigints: reads an arbitrary number of bytes into a JavaScript `bigint`
- Single and double precision floats
- Single characters and terminated strings in one of these encodings:
  - ASCII
  - UTF-8
  - UTF-16
  - UTF-32
- Fixed-length arrays of one of the above types

In most cases reading more than one byte requires a byte order to be set. The byte order can be set on the reader instance or on the data type provided to the `next()` method, the order on the data type takes precedence over the instance one. The `next()` method returns an object of the form `{ value: T, byteLength: number }`. While in many cases the number of bytes to read is known beforehand, this is not always the case. For example one character of text in UTF-8 encoding can be up to 4 bytes.

[npm-image]: https://img.shields.io/npm/v/@nishin/reader.svg
[npm-url]: https://npmjs.org/package/@nishin/reader
