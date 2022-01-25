import type { DataType } from './data';

export class ReadError extends Error {
	readonly dataType: DataType;
	readonly bytes: Uint8Array;

	constructor(message: string, dataType: DataType, bytes = new Uint8Array()) {
		super(message);
		this.dataType = dataType;
		this.bytes = bytes;
	}
}
