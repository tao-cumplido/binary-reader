/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { Private } from './private.js';

export type EnumFields<T = void> = T extends void
	? { readonly index?: number }
	: {
			readonly index?: number;
			readonly value?: T;
	  };

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/explicit-module-boundary-types
export const Enum = <Brand extends string, Value = void>(id: symbol) => {
	const indexMap = new Map();
	const valueMap = new Map();

	let currentIndex = 0;

	// eslint-disable-next-line @typescript-eslint/no-shadow
	return class Enum extends Private<Brand>(id) {
		static lookupIndex<C extends { prototype: Enum }>(this: C, index: number): C['prototype'] | undefined {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return indexMap.get(index);
		}

		static lookupValue<C extends { prototype: Enum }>(
			this: C,
			value: Value,
		): Value extends void ? never : C['prototype'] | undefined {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return valueMap.get(value);
		}

		#index: number;
		// @ts-expect-error
		#value: Value;

		get index(): number {
			return this.#index;
		}

		get value(): Value {
			return this.#value;
		}

		// @ts-expect-error
		constructor(check: symbol, { index, value }: EnumFields<Value> = {}) {
			if (new.target === Enum) {
				throw new Error(`Enum is an abstract class`);
			}

			super(check);

			if (!['undefined', 'number'].includes(typeof index) || (index && index < 0)) {
				throw new Error(`invalid index`);
			}

			if (typeof index === 'number') {
				currentIndex = index;
			}

			if (indexMap.get(currentIndex)) {
				throw new Error(`enum item at index ${currentIndex} already defined`);
			}

			if (typeof value !== 'undefined' && valueMap.get(value)) {
				throw new Error(`enum item for given value already defined`);
			}

			this.#index = currentIndex;

			indexMap.set(currentIndex++, this);

			if (typeof value !== 'undefined') {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				this.#value = value;
				valueMap.set(value, this);
			}
		}
	};
};
