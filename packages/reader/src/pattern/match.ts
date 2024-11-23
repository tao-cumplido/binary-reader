import type { ByteValidator, PatternValidator } from "../types.js";
import { backreferencePattern } from "./backreference.js";
import { rangePattern } from "./range.js";
import { wildcardPattern } from "./wildcard.js";

const cache = new Map<string, ByteValidator>();

const patterns = new Set<PatternValidator>([ wildcardPattern, rangePattern, backreferencePattern, ]);

export function matchPattern(pattern: string) {
	const cached = cache.get(pattern);

	if (cached) {
		return cached;
	}

	for (const validate of patterns) {
		const match = validate(pattern);

		if (match) {
			cache.set(pattern, match);
			return match;
		}
	}

	throw new Error(`invalid pattern: ${pattern}`);
}
