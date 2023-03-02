import type { ByteOrder } from '../byte-order.js';
import type { Decoder, InternalDataReader } from '../types.js';
import { arrayReader } from './array.js';
import { charReader } from './char.js';

export interface StringReaderTerminatorInit {
	readonly terminator: string;
}

export interface StringReaderCountInit {
	readonly count: number;
}

export interface StringReaderByteLengthInit {
	readonly byteLength: number;
}

export type StringReaderFactory = (
	decoder: Decoder,
	init?: Partial<StringReaderTerminatorInit & StringReaderCountInit & StringReaderByteLengthInit>,
	byteOrder?: ByteOrder,
) => InternalDataReader<string>;

interface PartialResult {
	value: string;
	sourceParts: Uint8Array[];
	sourceLength: number;
}

const combineParts = (result: PartialResult) => {
	const source = new Uint8Array(result.sourceLength);

	let offset = 0;

	for (const part of result.sourceParts) {
		source.set(part, offset);
		offset += part.byteLength;
	}

	return {
		value: result.value,
		source,
	};
};

export const stringReader: StringReaderFactory = (
	decoder,
	// eslint-disable-next-line @typescript-eslint/default-param-last
	{ terminator = '\0', count = -1, byteLength = -1 } = {},
	byteOrder,
) => {
	const char = charReader(decoder, byteOrder);

	return {
		sync: (state) => {
			if (count >= 0) {
				const array = arrayReader(char, count);
				const { value, source } = array.sync(state);
				return {
					value: value.join(''),
					source,
				};
			}

			const result: PartialResult = {
				value: '',
				sourceParts: [],
				sourceLength: 0,
			};

			let { offset } = state;

			if (byteLength >= 0) {
				while (result.sourceLength < byteLength) {
					const { value, source } = char({ ...state, offset });
					result.sourceParts.push(source);
					result.sourceLength += source.byteLength;
					result.value += value;
					offset += source.byteLength;
				}
			} else {
				let { value, source } = char(state);

				offset += source.byteLength;

				while (value !== terminator && offset < state.buffer.byteLength) {
					result.sourceParts.push(source);
					result.sourceLength += source.byteLength;
					result.value += value;
					({ value, source } = char({ ...state, offset }));
					offset += source.byteLength;
				}

				if (value !== terminator) {
					result.value += value;
				}

				result.sourceParts.push(source);
				result.sourceLength += source.byteLength;
			}

			return combineParts(result);
		},
		async: async (state, advanceOffset) => {
			if (count > 0) {
				const array = arrayReader(char, count);
				const { value, source } = await array.async(state, advanceOffset);
				return {
					value: value.join(''),
					source,
				};
			}

			let { buffer, offset } = state;

			const result: PartialResult = {
				value: '',
				sourceParts: [],
				sourceLength: 0,
			};

			if (byteLength >= 0) {
				while (result.sourceLength < byteLength) {
					const { value, source } = char({ ...state, buffer, offset });
					result.sourceParts.push(source);
					result.sourceLength += source.byteLength;
					result.value += value;
					({ buffer, offset } = await advanceOffset(source.byteLength));
				}
			} else {
				let { value, source } = char(state);

				({ buffer, offset } = await advanceOffset(source.byteLength));

				while (value !== terminator && offset < buffer.length) {
					result.sourceParts.push(source);
					result.sourceLength += source.byteLength;
					result.value += value;
					({ value, source } = char({ buffer, offset, byteOrder: state.byteOrder }));
					({ buffer, offset } = await advanceOffset(source.byteLength));
				}

				if (value !== terminator) {
					result.value += value;
				}

				result.sourceParts.push(source);
				result.sourceLength += source.byteLength;
			}

			return combineParts(result);
		},
	};
};
