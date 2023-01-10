import type { ByteOrder } from '../byte-order.js';
import { assertInt } from '../assert.js';
import { DataType } from './data-type.js';

export type SafeIntBytes = 1 | 2 | 3 | 4 | 5 | 6;

export class DataInt extends DataType {
	readonly signed: boolean;
	readonly byteLength: SafeIntBytes;
	readonly byteOrder?: ByteOrder;

	constructor(signed: boolean, byteLength: SafeIntBytes, byteOrder?: ByteOrder) {
		assertInt(byteLength, { min: 1, max: 6 });
		super();
		this.signed = signed;
		this.byteLength = byteLength;
		this.byteOrder = byteOrder;
	}
}

DataType.int = function int({ signed, byteLength }, byteOrder) {
	return new DataInt(signed, byteLength, byteOrder);
};

// @ts-expect-error
DataType.Uint8 = DataType.int({ signed: false, byteLength: 1 });
// @ts-expect-error
DataType.Uint16 = DataType.int({ signed: false, byteLength: 2 });
// @ts-expect-error
DataType.Uint32 = DataType.int({ signed: false, byteLength: 4 });
// @ts-expect-error
DataType.Int8 = DataType.int({ signed: true, byteLength: 1 });
// @ts-expect-error
DataType.Int16 = DataType.int({ signed: true, byteLength: 2 });
// @ts-expect-error
DataType.Int32 = DataType.int({ signed: true, byteLength: 4 });
