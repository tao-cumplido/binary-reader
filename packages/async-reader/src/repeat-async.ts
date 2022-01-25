export async function repeatAsync<T>(times: number, callback: () => Promise<T>): Promise<T[]> {
	const array = [];

	for (let i = 0; i < times; i++) {
		// eslint-disable-next-line no-await-in-loop
		array.push(await callback());
	}

	return array;
}
