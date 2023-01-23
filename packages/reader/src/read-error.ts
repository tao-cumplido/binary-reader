export class ReadError extends Error {
	readonly bytes: Uint8Array;

	constructor(message: string, bytes = new Uint8Array()) {
		super(message);
		this.bytes = bytes;
	}
}
