import fs from 'node:fs/promises';

import glob from 'fast-glob';

(await glob('packages/**/dist/cjs/**/*.js')).forEach(async (entry) => {
	const contents = await fs.readFile(entry, 'utf-8');
	await fs.writeFile(
		entry.replace(/\.js$/u, '.cjs'),
		contents.replaceAll(/require\("(?<file>.+)\.js"\)/gu, `require("$1.cjs")`),
	);
	await fs.rm(entry);
});
