import { regex } from "regex";
import { match, P } from "ts-pattern";

import type { ByteValidator, Pattern, PatternValidator } from "../types.js";
import { reHexDigit } from "./base.js";

type Operator = "+" | "-" | "*" | "/";

export const reBackreference = regex`^
	\$(?<leftRefIndex>\d|[1-9]\d+)
	(
		(?<operator>[\+\-\*\/])
		(
			(?<rightHandByte>${reHexDigit}{1,2})
			|
			(\$(?<rightRefIndex>\d|[1-9]\d+))
		)
	)?
$` as Pattern<{ leftRefIndex: string; } | { leftRefIndex: string; operator: Operator; rightHandByte: string; } | { leftRefIndex: string; operator: Operator; rightRefIndex: string; }>;

export const backreferencePattern: PatternValidator = (pattern) => {
	return match(reBackreference.exec(pattern)?.groups)
		.with(P.nullish, () => {
			return null;
		})
		.with({ operator: P.string, }, (data) => {
			const f = match(data.operator)
				.returnType<(left: number, right: number) => number>()
				.with("+", () => (left, right) => left + right)
				.with("-", () => (left, right) => left - right)
				.with("*", () => (left, right) => left * right)
				.with("/", () => (left, right) => Math.floor(left / right))
				.exhaustive();

			const leftIndex = parseInt(data.leftRefIndex);

			return match(data)
				.returnType<ByteValidator>()
				.with({ rightHandByte: P.string, }, ({ rightHandByte, }) => {
					const rightValue = parseInt(rightHandByte, 16);
					return (byte, backreferences) => match(backreferences[leftIndex])
						.with(P.nullish, () => false)
						.otherwise((leftValue) => byte === f(leftValue, rightValue));
				})
				.with({ rightRefIndex: P.string, }, ({ rightRefIndex, }) => {
					const rightIndex = parseInt(rightRefIndex);
					return (byte, backreferences) => match([ backreferences[leftIndex], backreferences[rightIndex], ])
						.with([ P.number, P.number, ], ([ leftValue, rightValue, ]) => byte === f(leftValue, rightValue))
						.otherwise(() => false);
				})
				.exhaustive();
		})
		.otherwise(({ leftRefIndex, }) => {
			const index = parseInt(leftRefIndex);
			return (byte, backreferences) => byte === backreferences[index];
		});
};
