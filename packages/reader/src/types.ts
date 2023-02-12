/* eslint-disable @typescript-eslint/consistent-type-definitions */

import type { ByteOrder } from './byte-order.js';

export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

/* prettier-ignore */
export type PartialPick<T extends object, K extends keyof T> =
	Partial<Pick<T, Extract<keyof T, K>>> & Omit<T, K> extends infer O ?
	{ [P in keyof O]: O[P] } :
	never;

/* prettier-ignore */
export type NonNegativeInteger<N extends number> =
	number extends N ? never :
	`${N}` extends `-${string}` | `${string}.${string}` ? never :
	N;

/* prettier-ignore */
export type Enumerate<N extends number, A extends number[] = []> =
	N extends NonNegativeInteger<N> ?
	A['length'] extends N ? A[number] :
	Enumerate<N, [...A, A['length']]> :
	never;

/* prettier-ignore */
export type UniformTuple<T, N extends number, A extends T[] = []> =
	N extends NonNegativeInteger<N> ?
	N extends Enumerate<100> ? (
		A['length'] extends N ? A :
		UniformTuple<T, N, [...A, T]>
	) :
	T[] :
	number extends N ? T[] :
	never;

/* prettier-ignore */
export type UniformReadonlyTuple<T, N extends number, A extends readonly T[] = readonly []> =
	N extends NonNegativeInteger<N> ?
	N extends Enumerate<100> ? (
		A['length'] extends N ? A :
		UniformReadonlyTuple<T, N, readonly [...A, T]>
	) :
	readonly T[] :
	number extends N ? readonly T[] :
	never;

export interface BytesValue<T> {
	readonly value: T;
	readonly source: Uint8Array;
}

export interface DataReaderState<Buffer extends Uint8Array> {
	readonly buffer: Buffer;
	readonly offset: number;
	readonly byteOrder?: ByteOrder;
}

export type DataReader<Value> = {
	<Buffer extends Uint8Array>(state: DataReaderState<Buffer>): BytesValue<Value>;
	maxRequiredBytes?: number;
};

export type AsyncDataReader<Value> = {
	<Buffer extends Uint8Array>(
		state: DataReaderState<Buffer>,
		advanceOffset: (value: number) => Promise<Omit<DataReaderState<Buffer>, 'byteOrder'>>,
	): Promise<BytesValue<Value>>;
	maxRequiredBytes?: number;
};

export interface InternalDataReader<Value> {
	readonly sync: DataReader<Value>;
	readonly async: AsyncDataReader<Value>;
	readonly maxRequiredBytes?: number;
}

export type SyncDataReaderLike<Value> = DataReader<Value> | PartialPick<InternalDataReader<Value>, 'async'>;

export type AsyncDataReaderLike<Value> =
	| DataReader<Value>
	| PartialPick<InternalDataReader<Value>, 'async'>
	| PartialPick<InternalDataReader<Value>, 'sync'>;

export type Decoder = {
	readonly decode: DataReader<string>;
	readonly maxRequiredBytes: number;
};
