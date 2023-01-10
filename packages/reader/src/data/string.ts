import type { Encoding } from '../encoding.js';
import { ByteOrder } from '../byte-order.js';
import { DataType } from './data-type.js';

export class DataString extends DataType {
	readonly encoding: Encoding;
	readonly terminator: string;
	readonly count: number;
	readonly byteOrder?: ByteOrder;

	constructor(encoding: Encoding, byteOrder?: ByteOrder, { terminator = '\0', count = 0 } = {}) {
		super();
		this.encoding = encoding;
		this.terminator = terminator;
		this.byteOrder = byteOrder;
		this.count = count;
	}
}

DataType.string = function string(
	encoding,
	byteOrderOrTerminatorOrCount?: ByteOrder | { terminator: string } | { count: number },
	byteOrder?: ByteOrder,
) {
	if (byteOrderOrTerminatorOrCount instanceof ByteOrder) {
		return new DataString(encoding, byteOrderOrTerminatorOrCount);
	}

	if (!byteOrderOrTerminatorOrCount) {
		return new DataString(encoding);
	}

	return new DataString(encoding, byteOrder, byteOrderOrTerminatorOrCount);
};
