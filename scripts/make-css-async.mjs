/**
 * make-css-async.mjs — Post-build script to make CSS non-blocking.
 *
 * Astro injects <link rel="stylesheet" href="..."> in <head>, which is render-blocking.
 * This script transforms each into the Filament Group pattern:
 *
 *   <link rel="preload" href="style.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
 *   <noscript><link rel="stylesheet" href="style.css"></noscript>
 *
 * This removes CSS from the critical render path, improving LCP.
 * The CSS file is still downloaded + parsed before paint thanks to preload,
 * but it no longer BLOCKS the HTML parser.
 *
 * Usage: node scripts/make-css-async.mjs
 * Run after: npx astro build (processes dist/client/*.html)
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const DIST_DIR = 'dist/client';

async function findHtmlFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await findHtmlFiles(fullPath)));
		} else if (extname(entry.name) === '.html') {
			files.push(fullPath);
		}
	}

	return files;
}

function transformCssLinks(html) {
	// Pattern: <link rel="stylesheet" href="...css">
	// Match Astro-injected stylesheet links (not manual ones with other attrs)
	const regex = /(<link\s+rel="stylesheet"\s+href="([^"]+)">)/g;

	let count = 0;
	const transformed = html.replace(regex, (match, _full, href) => {
		count++;
		// Use the Filament Group pattern — preload + onload swap
		// media="print" trick removed: use preload for better browser support
		return (
			`<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
			`<noscript><link rel="stylesheet" href="${href}"></noscript>`
		);
	});

	return { transformed, count };
}

async function main() {
	console.log('🎬 make-css-async: Processing HTML files in', DIST_DIR);

	const htmlFiles = await findHtmlFiles(DIST_DIR);
	console.log(`📄 Found ${htmlFiles.length} HTML files`);

	let totalTransformed = 0;

	for (const file of htmlFiles) {
		const html = await readFile(file, 'utf-8');
		const { transformed, count } = transformCssLinks(html);

		if (count > 0) {
			await writeFile(file, transformed, 'utf-8');
			const rel = file.replace(DIST_DIR + '/', '');
			console.log(`  ✅ ${rel} — ${count} stylesheet(s) made async`);
			totalTransformed += count;
		}
	}

	console.log(`\n🎉 Done! ${totalTransformed} stylesheet(s) made non-blocking across ${htmlFiles.length} HTML files.`);

	if (totalTransformed === 0) {
		console.log('ℹ️  No <link rel="stylesheet"> found — CSS may already be inlined or handled differently.');
	}
}

main().catch((err) => {
	console.error('❌ Error:', err);
	process.exit(1);
});
