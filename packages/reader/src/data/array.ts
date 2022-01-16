import { assertInt } from '../assert';
import { DataType } from './data-type';

export class DataArray<T extends DataType> extends DataType {
	readonly type: T;
	readonly count: number;

	constructor(type: T, count: number) {
		assertInt(count, { min: 0 });
		super();
		this.type = type;
		this.count = count;
	}
}

DataType.array = function array(type, count) {
	return new DataArray(type, count);
};
