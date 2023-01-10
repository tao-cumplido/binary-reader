import type { Decoder } from './decoder.js';
import { Encoding } from '../encoding.js';
import { ascii } from './ascii.js';
import { iso88591 } from './iso-8859-1.js';
import { utf8 } from './utf-8.js';
import { utf16 } from './utf-16.js';
import { utf32 } from './utf-32.js';

export const decoders = new Map<Encoding, Decoder>([
	[Encoding.ASCII, ascii],
	[Encoding.ISO88591, iso88591],
	[Encoding.UTF8, utf8],
	[Encoding.UTF16, utf16],
	[Encoding.UTF32, utf32],
]);
