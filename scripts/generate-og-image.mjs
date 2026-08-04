/**
 * Generate the default Open Graph image (1200×630) for FTCI.
 *
 * Why this script exists:
 *   `public/og-default.png` is referenced by every `og:image` / `twitter:image`
 *   meta tag on the homepage (see src/components/SEO.astro) and as the fallback
 *   cover for blog articles (see src/components/blog/ArticleSEO.astro). Without
 *   it, sharing https://ftci.fr/ on Facebook/LinkedIn/Twitter shows no preview
 *   image — a direct loss of social click-through.
 *
 *   Instead of shipping a heavy binary PNG in git history and editing it by
 *   hand each time the brand evolves, we keep a vector source (this script
 *   composes the OG layout as SVG using the brand colors from
 *   src/styles/global.css and the triskel logo from public/favicon.svg) and
 *   rasterize it to PNG with sharp. Re-run after any brand change.
 *
 * Usage:
 *   pnpm exec node scripts/generate-og-image.mjs
 *
 * Output:
 *   public/og-default.png  (1200×630, PNG)
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Brand palette — keep in sync with src/styles/global.css CSS custom properties.
const NAVY = '#0F1E3D';
const NAVY_LIGHT = '#1c2d54';
const ORANGE = '#EE6C1A';
const GREEN = '#1E9E4F';
const WHITE = '#FFFFFF';

// Read the favicon.svg and extract the triskel logo (defs + <g> + center circle)
// so the OG image reuses the exact same vector logo, not a re-drawn approximation.
const faviconSvg = readFileSync(resolve(root, 'public/favicon.svg'), 'utf-8');
const defsMatch = faviconSvg.match(/<defs>[\s\S]*?<\/defs>/);
const groupMatch = faviconSvg.match(/<g filter="url\(#ftci-glow\)">[\s\S]*?<\/g>/);
const circleMatch = faviconSvg.match(/<circle[^>]*fill="#02083e"[^>]*\/?>/);

if (!defsMatch || !groupMatch || !circleMatch) {
	console.error(
		'❌ Could not extract triskel from public/favicon.svg. Has the file structure changed?',
	);
	process.exit(1);
}

/**
 * The OG image SVG. 1200×630 is the canonical Open Graph aspect ratio
 * (1.91:1) recommended by Facebook/Twitter for summary_large_image cards.
 *
 * Layout (left to right):
 *   - Brand triskel logo on the left (scaled ×2.5 from the 128px source → 320px)
 *   - Wordmark "FTCI" + tagline + geo qualifier + URL on the right
 *   - Orange vertical accent bar on the far left edge
 *   - Green horizontal accent bar at the bottom
 *
 * The font is a generic sans-serif stack — sharp/librsvg resolves it to the
 * closest system font available (DejaVu Sans on Linux, Arial/Helvetica
 * elsewhere). We avoid web fonts here because sharp cannot fetch them at
 * rasterize time.
 */
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
        <defs>
                <linearGradient id="og-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="${NAVY}" />
                        <stop offset="100%" stop-color="${NAVY_LIGHT}" />
                </linearGradient>
                ${defsMatch[0].replace(/<defs>|<\/defs>/g, '')}
        </defs>

        <!-- Background gradient -->
        <rect width="1200" height="630" fill="url(#og-bg)" />

        <!-- Brand accent bars -->
        <rect x="0" y="0" width="12" height="630" fill="${ORANGE}" />
        <rect x="0" y="618" width="1200" height="12" fill="${GREEN}" />

        <!-- Triskel logo (scaled ×2.5 → ~320px, centered vertically on the left) -->
        <g transform="translate(140, 155) scale(2.5)">
                ${groupMatch[0]}
                ${circleMatch[0]}
        </g>

        <!-- Wordmark + tagline -->
        <text x="540" y="300" font-family="Arial, Helvetica, sans-serif" font-size="128" font-weight="800" fill="${WHITE}" letter-spacing="6">FTCI</text>
        <text x="540" y="360" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="400" fill="${WHITE}">Entreprise de Services du Numérique</text>
        <text x="540" y="410" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="${ORANGE}">ESN · Abidjan, Côte d'Ivoire</text>

        <!-- Footer URL -->
        <text x="540" y="530" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="400" fill="${WHITE}" opacity="0.55">ftci.fr</text>
</svg>`;

const outPath = resolve(root, 'public/og-default.png');

try {
	await sharp(Buffer.from(ogSvg)).png().toFile(outPath);
	const meta = await sharp(outPath).metadata();
	console.log(`✅ OG image generated: public/og-default.png`);
	console.log(`   Dimensions: ${meta.width}×${meta.height} | Format: ${meta.format}`);
} catch (err) {
	console.error('❌ Failed to rasterize OG image:', err);
	process.exit(1);
}
