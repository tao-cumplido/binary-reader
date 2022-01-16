import { Enum } from '@nishin/enum';

const id = Symbol('ByteOrder');

export class ByteOrder extends Enum<'ByteOrder', number>(id) {
	static readonly BigEndian = new ByteOrder(id, 0xfeff);
	static readonly LittleEndian = new ByteOrder(id, 0xfffe);

	private constructor(check: symbol, value: number) {
		super(check, { value });
	}
}
