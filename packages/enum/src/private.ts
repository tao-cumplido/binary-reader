// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/explicit-module-boundary-types
export const Private = <Brand extends string>(id: symbol) => {
	if (typeof id !== 'symbol') {
		throw new Error(`Private id must be a symbol`);
	}

	// eslint-disable-next-line @typescript-eslint/no-shadow
	return class Private {
		readonly #id: Brand;

		constructor(check: symbol) {
			if (new.target === Private) {
				throw new Error(`Private is an abstract class`);
			}

			if (check !== id) {
				throw new Error(`Private id mismatch: expected '${id.toString()}', got '${check.toString()}'`);
			}

			// @ts-expect-error
			this.#id = id;
		}
	};
};
