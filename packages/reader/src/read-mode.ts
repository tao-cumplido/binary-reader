import { Enum } from "@shigen/enum";

const id = Symbol("ReadMode");

export class ReadMode<T extends string = string> extends Enum<{ Brand: "ReadMode"; }>(id) {
	static readonly Value = new ReadMode(id, "value");
	static readonly Source = new ReadMode(id, "source");

	readonly type: T;

	constructor(check: symbol, type: T) {
		super(check);
		this.type = type;
	}
}
