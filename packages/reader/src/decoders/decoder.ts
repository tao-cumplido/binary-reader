import type { BinaryReader, DataValue } from '../binary-reader.js';
import type { DataChar } from '../data/index.js';

export type Decoder = (type: DataChar, reader: BinaryReader) => DataValue<string>;
