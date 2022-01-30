/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { Private } from './private.js';

export interface EnumIdentifier {
	readonly index?: number;
	readonly name?: string;
}

export type EnumFields<T = void> = T extends void ? EnumIdentifier : EnumIdentifier & { readonly value?: T };

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

		// @ts-expect-error
		#value: Value;
		#index: number;
		#name?: string;

		get value(): Value {
			return this.#value;
		}

		get index(): number {
			return this.#index;
		}

		get name(): string | undefined {
			if (!this.#name) {
				const entry = Object.entries(this.constructor).find(([_, item]) => item === this);
				this.#name = entry?.[0];
			}

			return this.#name;
		}

		// @ts-expect-error
		constructor(check: symbol, { index, name, value }: EnumFields<Value> = {}) {
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
			this.#name = name;

			indexMap.set(currentIndex++, this);

			if (typeof value !== 'undefined') {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				this.#value = value;
				valueMap.set(value, this);
			}
		}
	};
};
