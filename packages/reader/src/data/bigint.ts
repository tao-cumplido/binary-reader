import type { ByteOrder } from '../byte-order';
import { assertInt } from '../assert';
import { DataType } from './data-type';

export class DataBigInt extends DataType {
	readonly signed: boolean;
	readonly byteLength: number;
	readonly byteOrder?: ByteOrder;

	constructor(signed: boolean, byteLength: number, byteOrder?: ByteOrder) {
		assertInt(byteLength, { min: 1 });
		super();
		this.signed = signed;
		this.byteLength = byteLength;
		this.byteOrder = byteOrder;
	}
}

DataType.bigint = function bigint({ signed, byteLength }, byteOrder) {
	return new DataBigInt(signed, byteLength, byteOrder);
};

// @ts-expect-error
DataType.BigUint64 = DataType.bigint({ signed: false, byteLength: 8 });
// @ts-expect-error
DataType.BigInt64 = DataType.bigint({ signed: true, byteLength: 8 });
