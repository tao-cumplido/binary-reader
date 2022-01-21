import type { ByteOrder } from '../byte-order';
import { assertInt } from '../assert.js';
import { DataType } from './data-type.js';

export type FloatBytes = 4 | 8;

export class DataFloat extends DataType {
	readonly byteLength: FloatBytes;
	readonly byteOrder?: ByteOrder;

	constructor(byteLength: FloatBytes, byteOrder?: ByteOrder) {
		assertInt(byteLength, { values: [4, 8] });
		super();
		this.byteLength = byteLength;
		this.byteOrder = byteOrder;
	}
}

DataType.float = function float({ byteLength }, byteOrder?: ByteOrder) {
	return new DataFloat(byteLength, byteOrder);
};

// @ts-expect-error
DataType.Float32 = DataType.float({ byteLength: 4 });
// @ts-expect-error
DataType.Float64 = DataType.float({ byteLength: 8 });
