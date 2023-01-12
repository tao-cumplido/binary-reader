/* eslint-disable @typescript-eslint/consistent-type-definitions */

export type ValuePrimitive = boolean | number | string | bigint | undefined | void;

export type EnumFields = {
	readonly index?: number;
	readonly name?: string;
};

export type ValueEnumFields<Value extends ValuePrimitive> = EnumFields & { readonly value: Value };

declare class EnumInstance<Brand extends string> {
	readonly #id: Brand;
	readonly index: number;
	readonly name?: string;
}

declare class ValueEnumInstance<Brand extends string, Value> extends EnumInstance<Brand> {
	readonly value: Value;
}

/* prettier-ignore */
export type EnumConstructor<Brand extends string, Value extends ValuePrimitive> =
	void extends Value ? {
		lookupIndex: <C extends { prototype: EnumInstance<Brand> }>(this: C, index: number) => C['prototype'] | undefined;
		new (check: symbol, fields?: EnumFields): EnumInstance<Brand>;
	} :
	undefined extends Value ? {
		lookupIndex: <C extends { prototype: ValueEnumInstance<Brand, Value> }>(this: C, index: number) => C['prototype'] | undefined;
		lookupValue: <C extends { prototype: ValueEnumInstance<Brand, Value> }>(this: C, value: Value) => C['prototype'] | undefined;
		new (check: symbol, fields?: Partial<ValueEnumFields<Value>>): ValueEnumInstance<Brand, Value>;
	} :
	{
		lookupIndex: <C extends { prototype: ValueEnumInstance<Brand, Value> }>(this: C, index: number) => C['prototype'] | undefined;
		lookupValue: <C extends { prototype: ValueEnumInstance<Brand, Value> }>(this: C, value: Value) => C['prototype'] | undefined;
		new (check: symbol, fields: ValueEnumFields<Value>): ValueEnumInstance<Brand, Value>;
	};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Enum = <Brand extends string, Value extends ValuePrimitive = undefined>(
	id: symbol,
): EnumConstructor<Brand, Value> => {
	const indexMap = new Map();
	const valueMap = new Map();

	let currentIndex = 0;

	// @ts-expect-error
	return class Enum {
		static lookupIndex(index: number) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return indexMap.get(index);
		}

		static lookupValue(value: Value) {
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

		constructor(
			check: symbol,
			// @ts-expect-error
			{ index, name, value }: EnumFields<Value> = {},
		) {
			if (new.target === Enum) {
				throw new Error(`Enum is an abstract class`);
			}

			if (check !== id) {
				throw new Error(`Enum symbol id mismatch: expected '${id.toString()}', got '${check.toString()}'`);
			}

			if (!['undefined', 'number'].includes(typeof index) || index < 0) {
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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
