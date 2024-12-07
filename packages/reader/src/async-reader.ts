import { assertInt } from "./assert.js";
import { BinaryReader } from "./binary-reader.js";
import { ByteOrder } from "./byte-order.js";
import { DataType } from "./data-type.js";
import { Encoding } from "./encoding.js";
import { matchPattern } from "./pattern/match.js";
import { ReadError } from "./read-error.js";
import { ReadMode } from "./read-mode.js";
import type { AsyncDataReaderLike, AsyncSearchItem, BytesValue, SearchProgress } from "./types.js";

export interface AsyncReaderConfig {
	readonly bufferSize: number;
}

export type UpdateBuffer<Buffer extends Uint8Array> = (state: { offset: number; size: number; }) => Promise<Buffer>;

type AsyncReaderFindOptions = {
	readonly offset?: undefined | number;
	readonly microTaskByteLength?: undefined | number;
	readonly signal?: undefined | {
		readonly aborted: boolean;
		readonly reason: unknown;
		throwIfAborted(): void;
	};
};

declare var setTimeout: (callback: (...args: unknown[]) => unknown, delay?: number) => void;

export class AsyncReader<Buffer extends Uint8Array = Uint8Array> {
	#byteLength: number;
	#updateBuffer: UpdateBuffer<Buffer>;
	#bufferSize: number;
	#byteOrder: ByteOrder | undefined;
	#buffer?: Buffer;

	#bufferStart = 0;
	#offset = 0;

	get bufferStart(): number {
		return this.#bufferStart;
	}

	get offset(): number {
		return this.#offset;
	}

	get byteLength(): number {
		return this.#byteLength;
	}

	get byteOrder(): ByteOrder | undefined {
		return this.#byteOrder;
	}

	constructor(byteLength: number, updateBuffer: UpdateBuffer<Buffer>, config: AsyncReaderConfig);
	constructor(byteLength: number, updateBuffer: UpdateBuffer<Buffer>, byteOrder?: ByteOrder, config?: AsyncReaderConfig);
	constructor(
		byteLength: number,
		updateBuffer: UpdateBuffer<Buffer>,
		byteOrderOrConfig?: ByteOrder | AsyncReaderConfig,
		{ bufferSize = 2 ** 20 * 10, } = {},
	) {
		this.#byteLength = byteLength;
		this.#updateBuffer = updateBuffer;
		this.#byteOrder = byteOrderOrConfig instanceof ByteOrder ? byteOrderOrConfig : undefined;
		this.#bufferSize = byteOrderOrConfig instanceof ByteOrder ? bufferSize : byteOrderOrConfig?.bufferSize ?? bufferSize;
	}

	async #checkBufferBounds(delta: number, position = this.#offset + delta) {
		const buffer = await this.getBuffer();

		const bufferOffset = this.#offset - this.#bufferStart;

		if (bufferOffset + delta < 0 || bufferOffset + delta >= buffer.byteLength) {
			this.#buffer = await this.#updateBuffer({ offset: position, size: this.#bufferSize, });
			this.#bufferStart = position;
		}

		this.#offset = position;
	}

	async getBuffer(): Promise<Buffer> {
		if (!this.#buffer) {
			this.#buffer = await this.#updateBuffer({ offset: 0, size: this.#bufferSize, });
		}

		return this.#buffer;
	}

	hasNext(byteLength = 1): boolean {
		assertInt(byteLength, { min: 1, });
		return this.#offset + byteLength <= this.#byteLength;
	}

	setByteOrder(byteOrder: ByteOrder): void {
		this.#byteOrder = byteOrder;
	}

	async slice(size: number): Promise<AsyncReader<Buffer>> {
		await this.skip(size);
		const currentOffset = this.#offset;
		return new AsyncReader(
			size,
			async ({ offset, }) => this.#updateBuffer({ offset: currentOffset - size + offset, size: this.#bufferSize, }),
			this.#byteOrder,
			{ bufferSize: this.#bufferSize, },
		);
	}

	async seek(offset: number): Promise<void> {
		assertInt(offset, { min: 0, max: this.#byteLength, });
		const delta = offset - this.#offset;
		await this.#checkBufferBounds(delta);
	}

	async skip(bytes: number): Promise<void> {
		assertInt(bytes, { min: 0, });
		await this.seek(this.#offset + bytes);
	}

	async align(to: number): Promise<void> {
		assertInt(to, { min: 0, });
		await this.skip(((-this.offset % to) + to) % to);
	}

	async readByteOrderMark(offset = this.#offset): Promise<void> {
		await this.seek(offset);

		const value = await this.next(DataType.int({ signed: false, byteLength: 2, }, ByteOrder.BigEndian));

		const byteOrder = ByteOrder.lookupKey(value);

		if (!byteOrder) {
			throw new TypeError(`invalid byte order mark`);
		}

		this.setByteOrder(byteOrder);
	}

	async assertMagic(magic: string | Uint8Array, offset = this.#offset): Promise<void> {
		await this.seek(offset);

		if (typeof magic === "string") {
			const value = await this.next(DataType.string(Encoding.ASCII, { count: magic.length, }));
			if (magic !== value) {
				throw new TypeError(`invalid magic: expected '${magic}', got '${value}`);
			}
		} else {
			const value = await this.next(DataType.bytes(magic.length));

			for (let i = 0; i < value.length; i++) {
				if (value[i] !== magic[i]) {
					throw new TypeError(
						`invalid magic: expected 0x${magic[i]?.toString(16).padStart(2, "0")} at position ${i}, got 0x${value[i]
							?.toString(16)
							.padStart(2, "0")}`,
					);
				}
			}
		}
	}

	async next<Value>(type: AsyncDataReaderLike<Value>, mode: typeof ReadMode.Source): Promise<BytesValue<Value>>;
	async next<Value>(type: AsyncDataReaderLike<Value>, mode?: typeof ReadMode.Value): Promise<Value>;
	async next<Value>(
		type: AsyncDataReaderLike<Value>,
		mode: ReadMode = ReadMode.Value,
	): Promise<BytesValue<Value> | Value> {
		const read = typeof type === "function" ? type : type.async ?? type.sync;

		if (!read) {
			throw new Error(`invalid state: missing reader function`);
		}

		if (type.maxRequiredBytes) {
			await this.#checkBufferBounds(type.maxRequiredBytes, this.#offset);
		}

		const initialOffset = this.#offset;

		try {
			const buffer = await this.getBuffer();

			const result = await read(
				{
					buffer,
					offset: this.#offset - this.#bufferStart,
					byteOrder: this.#byteOrder,
				},
				async (value) => {
					await this.#checkBufferBounds(value);
					return {
						buffer: await this.getBuffer(),
						offset: this.#offset - this.#bufferStart,
					};
				},
			);

			await this.seek(initialOffset + result.source.byteLength);

			switch (mode) {
				case ReadMode.Source:
					return result;
				case ReadMode.Value:
					return result.value;
			}

			throw new ReadError(`unknown read mode`, result.source);
		} catch (error) {
			await this.seek(initialOffset);
			throw error;
		}
	}

	#validateSearchSequence(sequence: readonly AsyncSearchItem[], reader: AsyncReader) {
		return sequence.map((item) => {
			if (typeof item === "number") {
				return async () => reader.hasNext() && await reader.next(DataType.Uint8) === item;
			}

			if (typeof item === "string") {
				const validate = matchPattern(item);
				return async (backreferences: BinaryReader) => reader.hasNext() && validate(await reader.next(DataType.Uint8), backreferences.buffer);
			}

			return async (backreferences: BinaryReader) => {
				try {
					return await item(reader.next.bind(reader), backreferences);
				} catch {
					return false;
				}
			};
		});
	}

	async *findAll(sequence: readonly AsyncSearchItem[], { offset = this.#offset, microTaskByteLength = 100, signal, }: AsyncReaderFindOptions = {}): AsyncGenerator<SearchProgress, void> {
		assertInt(microTaskByteLength, { min: 1, });

		signal?.throwIfAborted();

		const reader = new AsyncReader(this.#byteLength, this.#updateBuffer, this.#byteOrder, { bufferSize: this.#bufferSize, });
		const validatedSequence = this.#validateSearchSequence(sequence, reader);

		progress: for (let searchOffset = offset; searchOffset <= reader.byteLength; searchOffset++) {
			if ((searchOffset - offset) % microTaskByteLength === 0) {
				await new Promise((resolve) => setTimeout(resolve));
			}

			await reader.seek(searchOffset);

			if (signal?.aborted || !reader.hasNext()) {
				signal?.throwIfAborted();
				yield { offset: reader.#offset, matchBytes: 0, };
				return;
			}

			for (const checkNext of validatedSequence) {
				const currentOffset = reader.#offset;
				await reader.seek(searchOffset);
				const referenceBuffer = await reader.next(DataType.bytes(currentOffset - searchOffset));
				const backreferences = new BinaryReader(referenceBuffer, reader.#byteOrder);
				await reader.seek(currentOffset);

				if (!(await checkNext(backreferences))) {
					yield { offset: searchOffset, matchBytes: 0, };
					continue progress;
				}
			}

			yield { offset: searchOffset, matchBytes: reader.#offset - searchOffset, };
		}
	}

	/**
	 * Search for a given sequence from current or given offset.
	 * Returns the offset where the found sequence starts or undefined.
	 * If a sequence is found, the read offset will point behind the sequence.
	 * An AbortSignal can be passed as option to cancel potentially long running searches.
	 */
	async find(sequence: readonly AsyncSearchItem[], options?: AsyncReaderFindOptions): Promise<number | undefined> {
		for await (const { offset, matchBytes, } of this.findAll(sequence, options)) {
			if (matchBytes) {
				await this.seek(offset + matchBytes);
				return offset;
			}
		};
	}
}
