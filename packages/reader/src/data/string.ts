import type { Encoding } from '../encoding';
import { ByteOrder } from '../byte-order';
import { DataType } from './data-type';

export class DataString extends DataType {
	readonly encoding: Encoding;
	readonly terminator: string;
	readonly byteOrder?: ByteOrder;

	constructor(encoding: Encoding, byteOrder?: ByteOrder, terminator = '\0') {
		super();
		this.encoding = encoding;
		this.terminator = terminator;
		this.byteOrder = byteOrder;
	}
}

DataType.string = function string(
	encoding,
	byteOrderOrTerminator?: ByteOrder | { terminator: string },
	byteOrder?: ByteOrder,
) {
	if (byteOrderOrTerminator instanceof ByteOrder) {
		return new DataString(encoding, byteOrderOrTerminator);
	}

	if (byteOrderOrTerminator) {
		return new DataString(encoding, byteOrder, byteOrderOrTerminator.terminator);
	}

	return new DataString(encoding);
};
