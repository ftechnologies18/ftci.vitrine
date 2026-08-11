#!/usr/bin/env node
/**
 * IndexNow URL submission script for FTCI Vitrine.
 *
 * IndexNow is a protocol supported by Yandex, Bing, and other search engines.
 * Submitting URLs to IndexNow notifies all participating search engines at once
 * that pages have been added, changed, or deleted — much faster than waiting for
 * organic recrawl.
 *
 * Prerequisites:
 *   - The IndexNow key file must be served at https://ftci.fr/<KEY>.txt
 *     (already deployed at /public/<KEY>.txt → becomes https://ftci.fr/<KEY>.txt)
 *   - The KEY constant below must match that file's name (without .txt).
 *
 * Usage:
 *   # Submit specific URLs:
 *   node scripts/indexnow-submit.mjs https://ftci.fr/ https://ftci.fr/blog
 *
 *   # Submit all known site URLs (homepage, blog, articles, categories, legal):
 *   node scripts/indexnow-submit.mjs --all
 *
 *   # Dry run (show what would be submitted without hitting the API):
 *   node scripts/indexnow-submit.mjs --all --dry-run
 *
 * API reference: https://www.indexnow.org/documentation
 * Yandex IndexNow endpoint: https://yandex.com/indexnow
 */

const KEY = 'ad02c6de813d4dd28ff6f48e0ddee9de';
const HOST = 'ftci.fr';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
// Bing-specific endpoint (the generic api.indexnow.org works too, but Bing's
// own endpoint verifies the site faster — see https://www.bing.com/indexnow).
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// The 6 blog categories (must match keystatic.config.ts BLOG_CATEGORIES).
const CATEGORIES = [
	'transformation-digitale',
	'intelligence-artificielle',
	'cloud-computing',
	'cybersecurite',
	'tech-innovation',
	'actualites-ftci',
];

// Static public URLs of the site (kept in sync with src/pages/sitemap.xml.ts).
const ALL_URLS = [
	`https://${HOST}/`,
	`https://${HOST}/blog`,
	...CATEGORIES.map((c) => `https://${HOST}/blog/categorie/${c}`),
	`https://${HOST}/blog/10-conseils-cybersecurite-entreprise`,
	`https://${HOST}/blog/ia-cas-usage-entreprises-africaines`,
	`https://${HOST}/blog/pourquoi-les-pme-africaines-doivent-elles-se-digitaliser-en-2026`,
	`https://${HOST}/blog/sect-nouvelle-version-20`,
	`https://${HOST}/legal/mentions-legales`,
	`https://${HOST}/legal/confidentialite`,
	`https://${HOST}/legal/cgu`,
];

/**
 * Submits URLs to IndexNow via POST (supports batch submission).
 * The body is a JSON payload identifying the host, the key, the key location,
 * and the list of URLs that were added/changed.
 */
async function submitUrls(urls, { dryRun = false } = {}) {
	if (urls.length === 0) {
		console.log('No URLs to submit.');
		return;
	}

	console.log(`Submitting ${urls.length} URL(s) to IndexNow...`);
	console.log(`  Key:  ${KEY}`);
	console.log(`  Host: ${HOST}`);
	console.log(`  Key location: ${KEY_LOCATION}`);
	console.log('');

	if (dryRun) {
		console.log('Dry run — would submit these URLs:');
		urls.forEach((u) => console.log(`  ${u}`));
		return;
	}

	const body = {
		host: HOST,
		key: KEY,
		keyLocation: KEY_LOCATION,
		urlList: urls,
	};

	try {
		const res = await fetch(INDEXNOW_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: JSON.stringify(body),
		});

		// IndexNow status codes:
		// 200 = OK, URLs submitted.
		// 202 = Accepted, will be processed async.
		// 400 = Bad request (malformed body).
		// 403 = Forbidden (key file mismatch / not reachable).
		// 422 = Unprocessable entity (key format invalid).
		console.log(`Response: HTTP ${res.status} ${res.statusText}`);
		if (res.status === 200 || res.status === 202) {
			console.log('✅ URLs submitted successfully.');
		} else if (res.status === 403) {
			console.log(
				'❌ HTTP 403: IndexNow could not verify the key. Check that https://ftci.fr/' +
					KEY +
					'.txt exists, is reachable, and contains exactly the key string.',
			);
			const text = await res.text();
			if (text) console.log('   Response body:', text);
		} else {
			const text = await res.text().catch(() => '');
			if (text) console.log('   Response body:', text);
		}
	} catch (err) {
		console.error('❌ Network error:', err.message);
		process.exit(1);
	}
}

// --- CLI ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const allFlag = args.includes('--all');
const urls = args.filter((a) => !a.startsWith('-'));

if (allFlag) {
	submitUrls(ALL_URLS, { dryRun });
} else if (urls.length > 0) {
	submitUrls(urls, { dryRun });
} else {
	console.log('IndexNow URL submission — FTCI Vitrine');
	console.log('');
	console.log('Usage:');
	console.log('  node scripts/indexnow-submit.mjs --all              Submit all known site URLs');
	console.log('  node scripts/indexnow-submit.mjs <url> [<url>...]   Submit specific URLs');
	console.log('  node scripts/indexnow-submit.mjs --all --dry-run    Show what would be submitted');
	console.log('');
	console.log(`Key:         ${KEY}`);
	console.log(`Key file:    ${KEY_LOCATION}`);
	console.log(`Endpoint:    ${INDEXNOW_ENDPOINT}`);
	console.log('');
	console.log('Known URLs:');
	ALL_URLS.forEach((u) => console.log(`  ${u}`));
}
