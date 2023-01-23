import type { AsyncDataReaderLike, BytesValue, InternalDataReader, UniformReadonlyTuple } from '../types.js';
import { assertInt } from '../assert.js';
import { ReadError } from '../read-error.js';
import { repeat, repeatAsync } from '../repeat.js';

export type ArrayReaderFactory = <Value, Count extends number>(
	type: AsyncDataReaderLike<Value>,
	count: Count,
) => InternalDataReader<UniformReadonlyTuple<Value, Count>>;

const combineItems = <Value>(items: Array<BytesValue<Value>>) => {
	let sourceLength = 0;

	for (const item of items) {
		sourceLength += item.source.byteLength;
	}

	const value: Value[] = [];
	const source = new Uint8Array(sourceLength);

	let offset = 0;

	for (const item of items) {
		value.push(item.value);
		source.set(item.source, offset);
		offset += item.source.byteLength;
	}

	return {
		value,
		source,
	};
};

export const errorMessage = {
	missingSyncRead: () => `missing sync read operation in item type`,
	missingAsyncRead: () => `missing read operation in item type`,
} as const;

export const arrayReader: ArrayReaderFactory = (type, count) => {
	assertInt(count, { min: 0 });

	const readSync = typeof type === 'function' ? type : type.sync;
	const readAsync = typeof type === 'object' ? type.async : undefined;

	return {
		sync: ({ buffer, offset, byteOrder }) => {
			if (!readSync) {
				throw new ReadError(errorMessage.missingSyncRead(), buffer.subarray());
			}

			const items = repeat(count, () => {
				const result = readSync({ buffer, offset, byteOrder });
				offset += result.source.byteLength;
				return result;
			});

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return combineItems(items) as any;
		},
		async: async ({ buffer, offset, byteOrder }, advanceOffset) => {
			const read = readAsync ?? readSync;

			if (!read) {
				throw new ReadError(errorMessage.missingAsyncRead(), buffer.subarray());
			}

			const items = await repeatAsync(count, async () => {
				const valueOrPromise = read({ buffer, offset, byteOrder }, advanceOffset);

				if (valueOrPromise instanceof Promise) {
					const result = await valueOrPromise;
					// eslint-disable-next-line require-atomic-updates
					({ buffer, offset } = await advanceOffset(0));
					return result;
				}

				// eslint-disable-next-line require-atomic-updates
				({ buffer, offset } = await advanceOffset(valueOrPromise.source.byteLength));

				return valueOrPromise;
			});

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return combineItems(items) as any;
		},
	};
};
