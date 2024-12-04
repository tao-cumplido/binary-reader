import { fstatSync } from "node:fs";
import type { FileHandle } from "node:fs/promises";

import { AsyncReader, ByteOrder, type AsyncReaderConfig } from "@nishin/reader";

export class NodeFileReader extends AsyncReader<Buffer> {
	#fileHandle: FileHandle;

	get fileHandle(): FileHandle {
		return this.#fileHandle;
	}

	constructor(fileHandle: FileHandle, { bufferSize, }: AsyncReaderConfig);
	constructor(fileHandle: FileHandle, byteOrder?: ByteOrder, { bufferSize, }?: AsyncReaderConfig);
	constructor(fileHandle: FileHandle, byteOrderOrConfig?: ByteOrder | AsyncReaderConfig, config?: AsyncReaderConfig) {
		const byteOrder = byteOrderOrConfig instanceof ByteOrder ? byteOrderOrConfig : undefined;
		const resolvedConfig = byteOrderOrConfig instanceof ByteOrder ? config : byteOrderOrConfig;

		super(
			fstatSync(fileHandle.fd).size,
			async ({ offset, size, }) => {
				const buffer = Buffer.alloc(size);
				const { bytesRead, } = await fileHandle.read(buffer, 0, size, offset);
				return buffer.subarray(0, bytesRead);
			},
			byteOrder,
			resolvedConfig,
		);

		this.#fileHandle = fileHandle;
	}

	async close(): Promise<void> {
		await this.#fileHandle.close();
	}

	async [Symbol.asyncDispose](): Promise<void> {
		await this.close();
	}
}
