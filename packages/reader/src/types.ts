import type { AsyncReader } from "./async-reader.js";
import type { BinaryReader } from "./binary-reader.js";
import type { ByteOrder } from "./byte-order.js";

export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

export type PartialPick<T extends object, K extends keyof T> =
	Partial<Pick<T, Extract<keyof T, K>>> & Omit<T, K> extends infer O ?
	{ [P in keyof O]: O[P] } :
	never;

export type NonNegativeInteger<N extends number> =
	number extends N ? never :
	`${N}` extends `-${string}` | `${string}.${string}` ? never :
	N;

export type Enumerate<N extends number, A extends number[] = []> =
	N extends NonNegativeInteger<N> ?
	A["length"] extends N ? A[number] :
	Enumerate<N, [...A, A["length"]]> :
	never;

export type UniformTuple<T, N extends number, A extends T[] = []> =
	N extends NonNegativeInteger<N> ?
	N extends Enumerate<100> ? (
		A["length"] extends N ? A :
		UniformTuple<T, N, [...A, T]>
	) :
	T[] :
	number extends N ? T[] :
	never;

export type UniformReadonlyTuple<T, N extends number, A extends readonly T[] = readonly []> =
	N extends NonNegativeInteger<N> ?
	N extends Enumerate<100> ? (
		A["length"] extends N ? A :
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
	readonly byteOrder?: ByteOrder | undefined;
}

export type DataReader<Value> = {
	<Buffer extends Uint8Array>(state: DataReaderState<Buffer>): BytesValue<Value>;
	maxRequiredBytes?: number | undefined;
};

export type AsyncDataReader<Value> = {
	<Buffer extends Uint8Array>(
		state: DataReaderState<Buffer>,
		advanceOffset: (value: number) => Promise<Omit<DataReaderState<Buffer>, "byteOrder">>,
	): Promise<BytesValue<Value>>;
	maxRequiredBytes?: number | undefined;
};

export interface InternalDataReader<Value> {
	readonly sync: DataReader<Value>;
	readonly async: AsyncDataReader<Value>;
	readonly maxRequiredBytes?: number | undefined;
}

export type SyncDataReaderLike<Value> = DataReader<Value> | PartialPick<InternalDataReader<Value>, "async">;

export type AsyncDataReaderLike<Value> =
	| DataReader<Value>
	| PartialPick<InternalDataReader<Value>, "async">
	| PartialPick<InternalDataReader<Value>, "sync">;

export type Decoder = {
	readonly minBytes: number;
	readonly maxBytes: number;
	readonly decode: DataReader<string>;
};

export type ByteValidator = (value: number, backreferences: Uint8Array) => boolean;
export type SearchItem = number | string;
export type SyncSearchItem<Buffer extends Uint8Array> = SearchItem | ((next: BinaryReader<Buffer>["next"], backreferences: BinaryReader) => boolean);
export type AsyncSearchItem<Buffer extends Uint8Array> = SearchItem | ((next: AsyncReader<Buffer>["next"], backreferences: BinaryReader) => Promise<boolean>);
export type PatternValidator = (pattern: string) => ByteValidator | null;

interface PatternExecResult<Groups> {
	readonly groups: Readonly<Groups>;
}

export interface Pattern<Groups extends Record<string, string> | undefined = undefined> {
	exec(value: string): PatternExecResult<Groups> | null;
}
