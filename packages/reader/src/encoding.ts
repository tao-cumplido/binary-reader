import { Enum } from '@nishin/enum';

import { assertInt } from './assert.js';

const id = Symbol('Encoding');

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export class Encoding extends Enum<'Encoding', void>(id) {
	static readonly ASCII = new Encoding(id, 1, 1);
	static readonly ISO88591 = new Encoding(id, 1, 1);
	static readonly UTF8 = new Encoding(id, 1, 4);
	static readonly UTF16 = new Encoding(id, 2, 4);
	static readonly UTF32 = new Encoding(id, 4, 4);

	readonly minBytes: number;
	readonly maxBytes: number;

	private constructor(check: symbol, minBytes: number, maxBytes: number) {
		super(check);
		assertInt(minBytes, { min: 1, max: maxBytes });
		assertInt(maxBytes, { min: minBytes });
		this.minBytes = minBytes;
		this.maxBytes = maxBytes;
	}
}
