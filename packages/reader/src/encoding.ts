import { Enum } from '@nishin/enum';

import { assertInt } from './assert.js';

const id = Symbol('Encoding');

export class Encoding extends Enum<'Encoding'>(id) {
	static readonly ASCII = new Encoding(id, 1);
	static readonly ISO88591 = new Encoding(id, 1);
	static readonly UTF8 = new Encoding(id, 4);
	static readonly UTF16 = new Encoding(id, 4);
	static readonly UTF32 = new Encoding(id, 4);

	readonly maxBytes: number;

	private constructor(check: symbol, maxBytes: number) {
		super(check);
		assertInt(maxBytes, { min: 1 });
		this.maxBytes = maxBytes;
	}
}
