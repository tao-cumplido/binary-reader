import { regex } from "regex";
import { match, P } from "ts-pattern";

import type { ByteValidator, Pattern, PatternValidator } from "../types.js";
import { reHexDigit } from "./base.js";

export const reWildcard = regex`^(?<upper>${reHexDigit}|\?)(?<lower>${reHexDigit}|\?)$` as Pattern<{ upper: string; lower: string; }>;

export const wildcardPattern: PatternValidator = (pattern) => {
	return match(reWildcard.exec(pattern)?.groups)
		.returnType<ByteValidator | null>()
		.with(P.nullish, () => {
			return null;
		})
		.with({ upper: "?", lower: "?", }, () => {
			return () => true;
		})
		.with({ upper: "?", }, ({ lower, }) => {
			const value = parseInt(lower, 16);
			return (byte) => (byte & 0x0f) === value;
		})
		.with({ lower: "?", }, ({ upper, }) => {
			const value = parseInt(upper, 16) << 4;
			return (byte) => (byte & 0xf0) === value;
		})
		.otherwise(({ upper, lower, }) => {
			const value = parseInt(`${upper}${lower}`, 16);
			return (byte) => byte === value;
		});
};
