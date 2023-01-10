declare class PrivateInstance<Brand extends string> {
	readonly #id: Brand;
}

export type PrivateConstructor<Brand extends string> = new (check: symbol) => PrivateInstance<Brand>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Private = <Brand extends string>(id: symbol): PrivateConstructor<Brand> => {
	if (typeof id !== 'symbol') {
		throw new Error(`Private id must be a symbol`);
	}

	// @ts-expect-error
	// eslint-disable-next-line @typescript-eslint/no-extraneous-class
	return class Private {
		constructor(check: symbol) {
			if (new.target === Private) {
				throw new Error(`Private is an abstract class`);
			}

			if (check !== id) {
				throw new Error(`Private id mismatch: expected '${id.toString()}', got '${check.toString()}'`);
			}
		}
	};
};
