# Asynchronous binary reader for Node.JS

> Read various data types from a file handle in a streamlined way

[![NPM Version][npm-image]][npm-url]

The `NodeFileReader` class implements file handle access on top of the `AsyncReader` class and is suitable to read very large files as the file is only partially loaded into memory while traversing it. The API layer is almost identical to the `BinaryReader` class, only that most methods return promises instead.

For details on supported data types consult the [@nishin/reader](../reader) readme.

## Usage

```js
import fs from 'node:fs/promises';

import { NodeFileReader, DataType } from '@nishin/node-file-reader';

const reader = new NodeFileReader(await fs.open('/path/to/large/file'), ByteOrder.BigEndian, { bufferSize: 8192 });

const data = await reader.next(DataType.Uint8);

await reader.close();
```

[npm-image]: https://img.shields.io/npm/v/@nishin/node-file-reader.svg
[npm-url]: https://npmjs.org/package/@nishin/node-file-reader
