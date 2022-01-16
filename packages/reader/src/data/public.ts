export type Public<T> = {
	readonly [P in keyof T]: T[P];
};
