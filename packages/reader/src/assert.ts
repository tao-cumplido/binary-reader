export interface AssertMessage {
	message?: string;
}

export interface AssertIntMinMax extends AssertMessage {
	min?: number;
	max?: number;
}

export interface AssertIntValues extends AssertMessage {
	values: number[];
}

export function assertInt(value: number, options: AssertIntValues): void;
export function assertInt(value: number, options?: AssertIntMinMax): void;
export function assertInt(
	value: number,
	{
		min = -Infinity,
		max = Infinity,
		values = [],
		message = `expected integer in ${values.length ? `[${values.join(", ")}]` : `range [${min}, ${max}]`}, got ${value}`,
	}: Partial<AssertIntMinMax & AssertIntValues> = {},
): void {
	const check = () => {
		if (!Number.isInteger(value)) {
			return false;
		}

		if (values.length) {
			return values.includes(value);
		}

		return value >= min && value <= max;
	};

	if (!check()) {
		throw new TypeError(message);
	}
}
