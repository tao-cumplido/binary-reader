export function repeat<T>(times: number, callback: () => T): T[] {
	return Array.from({ length: times }).map(() => callback());
}
