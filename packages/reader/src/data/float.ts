import { assertInt } from '../assert';
import { DataType } from './data-type';

export type FloatBytes = 4 | 8;

export class DataFloat extends DataType {
	readonly byteLength: FloatBytes;

	constructor(byteLength: FloatBytes) {
		assertInt(byteLength, { values: [4, 8] });
		super();
		this.byteLength = byteLength;
	}
}

DataType.float = function float({ byteLength }) {
	return new DataFloat(byteLength);
};

// @ts-expect-error
DataType.Float32 = DataType.float({ byteLength: 4 });
// @ts-expect-error
DataType.Float64 = DataType.float({ byteLength: 8 });
