import { Enum } from '@nishin/enum';

const id = Symbol('ReadMode');

export class ReadMode<T extends string = string> extends Enum<'ReadMode', void>(id) {
	static readonly Value = new ReadMode(id, 'value');
	static readonly Source = new ReadMode(id, 'source');

	readonly type: T;

	constructor(check: symbol, type: T) {
		super(check);
		this.type = type;
	}
}
