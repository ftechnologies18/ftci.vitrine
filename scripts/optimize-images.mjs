#!/usr/bin/env node
/**
 * optimize-images.mjs — Lossless/lossy optimization of static public/ assets.
 *
 * Why this script exists:
 *   Several images under `public/` were shipped at their original (often
 *   oversized) resolution and quality. They are served as-is by Cloudflare
 *   Workers (no on-the-fly transformation), so every byte lands in the user's
 *   browser. The worst offender was a 982 KB WebP cover image — larger than
 *   the rest of the page combined — directly hurting LCP on the article page.
 *
 *   This script re-encodes each target image in place with sharp, using:
 *     - PNG  : palette mode + compressionLevel 9 (lossless visually, smaller)
 *     - JPEG : mozjpeg quality 82 (visually indistinguishable, ~50% smaller)
 *     - WebP : quality 80, effort 6 (good quality/size ratio)
 *   Images larger than their display size are downscaled (cover images to
 *   max 1408px width, og-default stays 1200×630 as required by OG spec).
 *
 * Usage:
 *   node scripts/optimize-images.mjs           # optimize all targets
 *   node scripts/optimize-images.mjs --dry-run # report gains without writing
 *
 * Re-run after any brand image change or new blog cover upload.
 */

import sharp from 'sharp';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const dryRun = process.argv.includes('--dry-run');

/**
 * Optimization targets. Each entry declares the file path (relative to project
 * root), the sharp pipeline to apply, and an optional `maxWidth` to downscale.
 *
 * PNG targets use `palette: true` which reduces color depth to 256 when
 * beneficial — logos and icons with flat colors compress extremely well.
 * JPEG targets use `mozjpeg: true` for better compression than libjpeg.
 * WebP targets use `quality: 80` — visually lossless for photographic content.
 */
const targets = [
	// Brand & OG (served on every page or referenced in meta tags)
	{
		path: 'public/og-default.png',
		type: 'png',
		options: { compressionLevel: 9, palette: true, effort: 10 },
	},
	{
		path: 'public/brand/ftci-a.jpg',
		type: 'jpg',
		maxWidth: 1200,
		options: { quality: 82, mozjpeg: true },
	},
	{
		path: 'public/brand/logo-ftci.png',
		type: 'png',
		options: { compressionLevel: 9, palette: true, effort: 10 },
	},
	{
		path: 'public/brand/logo-ftci-nobg.png',
		type: 'png',
		options: { compressionLevel: 9, palette: true, effort: 10 },
	},
	{
		path: 'public/brand/icon-512.png',
		type: 'png',
		options: { compressionLevel: 9, palette: true, effort: 10 },
	},
	{
		path: 'public/brand/icon-192.png',
		type: 'png',
		options: { compressionLevel: 9, palette: true, effort: 10 },
	},
	{
		path: 'public/brand/apple-touch-icon.png',
		type: 'png',
		options: { compressionLevel: 9, palette: true, effort: 10 },
	},
	// Blog cover images (the heaviest payloads on article pages)
	{
		path: 'public/blog/images/10-conseils-cybersecurite-entreprise/coverImage.webp',
		type: 'webp',
		maxWidth: 1408,
		options: { quality: 80, effort: 6 },
	},
	{
		path: 'public/blog/images/sect-nouvelle-version-2.0/coverImage.webp',
		type: 'webp',
		maxWidth: 1408,
		options: { quality: 80, effort: 6 },
	},
	{
		path: 'public/blog/images/ia-cas-usage-entreprises-africaines/coverImage.webp',
		type: 'webp',
		maxWidth: 1408,
		options: { quality: 80, effort: 6 },
	},
	{
		path: 'public/blog/images/pourquoi-les-pme-africaines-doivent-elles-se-digitaliser-en-2026/coverImage.webp',
		type: 'webp',
		maxWidth: 1408,
		options: { quality: 80, effort: 6 },
	},
];

function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
	return `${(bytes / (1024 * 1024)).toFixed(2)}M`;
}

async function optimizeOne(target) {
	const absPath = resolve(root, target.path);
	const original = await readFile(absPath);
	const originalSize = (await stat(absPath)).size;

	let pipeline = sharp(original, { failOn: 'none' });

	// Downscale if the image exceeds the display size.
	if (target.maxWidth) {
		const meta = await pipeline.metadata();
		if (meta.width && meta.width > target.maxWidth) {
			pipeline = pipeline.resize({
				width: target.maxWidth,
				withoutEnlargement: true,
			});
		}
	}

	// Apply format-specific re-encoding.
	let outputBuffer;
	switch (target.type) {
		case 'png':
			outputBuffer = await pipeline.png(target.options).toBuffer();
			break;
		case 'jpg':
			outputBuffer = await pipeline.jpeg(target.options).toBuffer();
			break;
		case 'webp':
			outputBuffer = await pipeline.webp(target.options).toBuffer();
			break;
		default:
			throw new Error(`Unknown type: ${target.type}`);
	}

	const saved = originalSize - outputBuffer.length;
	const pct = ((saved / originalSize) * 100).toFixed(1);
	const sign = saved >= 0 ? '-' : '+';
	const status = dryRun ? '(dry-run, pas écrit)' : '✅';

	if (!dryRun) {
		await writeFile(absPath, outputBuffer);
	}

	console.log(
		`  ${status} ${target.path.padEnd(70)} ${formatBytes(originalSize)} → ${formatBytes(outputBuffer.length)}  (${sign}${pct}%)`,
	);

	return { path: target.path, originalSize, newSize: outputBuffer.length, saved };
}

async function main() {
	console.log(`🎬 optimize-images — ${dryRun ? 'DRY RUN' : 'écriture en place'}\n`);

	let totalOriginal = 0;
	let totalNew = 0;

	for (const target of targets) {
		try {
			const result = await optimizeOne(target);
			totalOriginal += result.originalSize;
			totalNew += result.newSize;
		} catch (err) {
			console.error(`  ❌ ${target.path}: ${err.message}`);
		}
	}

	const totalSaved = totalOriginal - totalNew;
	const totalPct = ((totalSaved / totalOriginal) * 100).toFixed(1);
	console.log('\n' + '─'.repeat(80));
	console.log(
		`📊 Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalNew)}  (économie: ${formatBytes(totalSaved)}, -${totalPct}%)`,
	);
}

main().catch((err) => {
	console.error('❌ Fatal:', err);
	process.exit(1);
});
