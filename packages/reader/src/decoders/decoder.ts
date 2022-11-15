import type { BinaryReader, DataValue } from '../binary-reader';
import type { DataChar } from '../data';

export type Decoder = (type: DataChar, reader: BinaryReader) => DataValue<string>;
