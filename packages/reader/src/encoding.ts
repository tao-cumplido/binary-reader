import { Enum } from '@nishin/enum';

import type { DataReader, Decoder } from './types.js';
import { ascii } from './decoders/ascii.js';
import { iso88591 } from './decoders/iso-8859-1.js';
import { utf8 } from './decoders/utf-8.js';
import { utf16 } from './decoders/utf-16.js';
import { utf32 } from './decoders/utf-32.js';

const id = Symbol('Encoding');

export class Encoding extends Enum<'Encoding', void>(id) implements Decoder {
	static readonly ASCII = new Encoding(id, ascii);
	static readonly ISO88591 = new Encoding(id, iso88591);
	static readonly UTF8 = new Encoding(id, utf8);
	static readonly UTF16 = new Encoding(id, utf16);
	static readonly UTF32 = new Encoding(id, utf32);

	readonly decode: DataReader<string>;
	readonly maxRequiredBytes: number;

	private constructor(check: symbol, decoder: Decoder) {
		super(check);

		this.decode = decoder.decode;
		this.maxRequiredBytes = decoder.maxRequiredBytes;
	}
}
