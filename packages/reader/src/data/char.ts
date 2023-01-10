import type { ByteOrder } from '../byte-order.js';
import type { Encoding } from '../encoding.js';
import { DataType } from './data-type.js';

export class DataChar extends DataType {
	readonly encoding: Encoding;
	readonly byteOrder?: ByteOrder;

	constructor(encoding: Encoding, byteOrder?: ByteOrder) {
		super();
		this.encoding = encoding;
		this.byteOrder = byteOrder;
	}
}

DataType.char = function char(encoding, byteOrder) {
	return new DataChar(encoding, byteOrder);
};
