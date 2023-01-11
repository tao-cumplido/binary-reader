import type { ByteOrder } from '../byte-order.js';
import type { Encoding } from '../encoding.js';
import type { DataArray } from './array.js';
import type { DataBigInt } from './bigint.js';
import type { DataBoolean } from './boolean.js';
import type { DataChar } from './char.js';
import type { DataFloat } from './float.js';
import type { DataInt } from './int.js';
import type { DataString } from './string.js';

type Public<T> = {
	readonly [P in keyof T]: T[P];
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace DataType {
	/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/init-declarations */
	export const Boolean: DataBoolean;
	export const Uint8: DataInt;
	export const Uint16: DataInt;
	export const Uint32: DataInt;
	export const Int8: DataInt;
	export const Int16: DataInt;
	export const Int32: DataInt;
	export const BigUint64: DataBigInt;
	export const BigInt64: DataBigInt;
	export const Float32: DataFloat;
	export const Float64: DataFloat;
	/* eslint-enable @typescript-eslint/naming-convention, @typescript-eslint/init-declarations */

	export function boolean(): DataBoolean;
	export function int({ signed, byteLength }: Public<DataInt>, byteOrder?: ByteOrder): DataInt;
	export function bigint({ signed, byteLength }: Public<DataBigInt>, byteOrder?: ByteOrder): DataBigInt;
	export function float({ byteLength }: Public<DataFloat>, byteOrder?: ByteOrder): DataFloat;
	export function char(encoding: Encoding, byteOrder?: ByteOrder): DataChar;
	export function string(encoding: Encoding, { terminator }?: { terminator: string }, byteOrder?: ByteOrder): DataString;
	export function string(encoding: Encoding, { count }?: { count: number }, byteOrder?: ByteOrder): DataString;
	export function string(encoding: Encoding, byteOrder?: ByteOrder): DataString;
	export function array<T extends DataType>(type: T, count: number): DataArray<T>;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export abstract class DataType {
	constructor() {
		if (new.target === DataType) {
			throw new Error(`DataType is an abstract class`);
		}
	}
}
