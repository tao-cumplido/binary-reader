# Asynchronous binary reader for Node.JS

> Read various data types from a file handle in a streamlined way

[![NPM Version][npm-image]][npm-url]

The `AsyncReader` class is the asynchronous version of [@nishin/reader](../reader) and is suitable to read very large files as the file is only partially loaded into memory while traversing it. The API layer is almost identical to the `BinaryReader` class, only that most methods return promises instead.

For details on supported data types consult the [@nishin/reader](../reader) readme.

## Installation

```sh
npm install @nishin/async-reader
```

## Usage

```js
import fs from 'node:fs/promises';

import { AsyncReader, DataType } from '@nishin/async-reader';

const reader = new AsyncReader(await fs.open('/path/to/large/file'), ByteOrder.BigEndian, { bufferSize: 8192 });

const data = await reader.next(DataType.Uint8);

await reader.close();
```

## API

```ts
interface Config {
	/**
	 * Size of the data held in memory at once.
	 * Default is 2 ** 20 * 10, i.e. 10 MB.
	 * A lower buffer size makes reading potentially slower since the data has to be updated more often.
	 * The buffer must be at least as large as the smallest data unit to read:
	 * For example, if reading of double precision floats is required the buffer size cannot be less than 8 bytes.
	 */ 
	readonly bufferSize: number; 
}

class AsyncReader {
	readonly offset: number;
	readonly buffer: Uint8Array;
	readonly byteOrder?: ByteOrder;

	constructor(fileHandle: FileHandle, byteOrder?: ByteOrder, { bufferSize }?: Config);
	constructor(fileHandle: FileHandle, { bufferSize }: Config);

	setByteOrder(byteOrder: ByteOrder): void;

	async slice(size: number): Promise<BinaryReader>;
	async seek(offset: number): Promise<void>;
	async skip(bytes: number): Promise<void>;
	async align(to: number): Promise<void>;

	async readByteOrderMark(offset?: number): Promise<void>;
	async assertMagix(magic: string | Uint8Array, offset?: number): Promise<void>;
	async next<T extends DataType | Struct>(type: T): Promise<Read<T>>;

	async close(): Promise<void>;
}
```

[npm-image]: https://img.shields.io/npm/v/@nishin/async-reader.svg
[npm-url]: https://npmjs.org/package/@nishin/async-reader
