import { Enum } from '@nishin/enum';

import type { Decoder } from './types.js';
import { assertInt } from './assert.js';
import { ascii } from './decoders/ascii.js';
import { iso88591 } from './decoders/iso-8859-1.js';
import { utf8 } from './decoders/utf-8.js';
import { utf16 } from './decoders/utf-16.js';
import { utf32 } from './decoders/utf-32.js';

const id = Symbol('Encoding');

export class Encoding extends Enum<'Encoding', void>(id) {
	static readonly ASCII = new Encoding(id, 1, 1, ascii);
	static readonly ISO88591 = new Encoding(id, 1, 1, iso88591);
	static readonly UTF8 = new Encoding(id, 1, 4, utf8);
	static readonly UTF16 = new Encoding(id, 2, 4, utf16);
	static readonly UTF32 = new Encoding(id, 4, 4, utf32);

	readonly minBytes: number;
	readonly maxBytes: number;

	readonly decode: Decoder;

	private constructor(check: symbol, minBytes: number, maxBytes: number, decode: Decoder) {
		super(check);

		assertInt(minBytes, { min: 1, max: maxBytes });
		assertInt(maxBytes, { min: minBytes });

		this.minBytes = minBytes;
		this.maxBytes = maxBytes;

		this.decode = decode;
	}
}
