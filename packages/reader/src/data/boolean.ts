import { DataType } from './data-type';

export class DataBoolean extends DataType {}

DataType.boolean = function boolean() {
	return new DataBoolean();
};

// @ts-expect-error
DataType.Boolean = new DataBoolean();
