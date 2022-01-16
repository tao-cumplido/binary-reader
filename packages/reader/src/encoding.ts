import { Enum } from '@nishin/enum';

const id = Symbol('Encoding');

export class Encoding extends Enum<'Encoding'>(id) {
	static readonly ASCII = new Encoding(id);
	static readonly UTF8 = new Encoding(id);
	static readonly UTF16 = new Encoding(id);
	static readonly UTF32 = new Encoding(id);

	private constructor(check: symbol) {
		super(check);
	}
}
