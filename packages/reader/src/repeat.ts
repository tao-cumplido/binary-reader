export function repeat<T>(times: number, callback: () => T): T[] {
	const result = new Array<T>(times);

	for (let i = 0; i < times; i++) {
		result[i] = callback();
	}

	return result;
}

export async function repeatAsync<T>(times: number, callback: () => Promise<T>): Promise<T[]> {
	const result = new Array<T>(times);

	for (let i = 0; i < times; i++) {
		result[i] = await callback();
	}

	return result;
}
