/**
 * `/sitemap.xml` endpoint for the FTCI vitrine.
 *
 * Emits the sitemaps.org XML protocol listing every public indexable page:
 * home, blog index, blog category pages, blog articles, and the three legal
 * pages. The per-product solution pages (`/solutions/*`) have been removed —
 * the products now live on their own subdomains and are linked directly from
 * the footer/home, so they are not part of this site's own sitemap. Astro
 * prerenders the route at build time, so the URL set is fixed per deploy.
 *
 * SEO decisions (Lot 3):
 *   - Static routes omit `<lastmod>`. Google ignores `lastmod` values that
 *     change every build without semantic meaning (the previous `today`
 *     value was a spam signal). Search engines fall back to If-Modified-Since.
 *     Reference: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 *   - Blog article `<lastmod>` uses `updatedAt ?? publishedAt` — reflects
 *     actual content revisions rather than build date.
 *   - Blog articles with a `coverImage` emit an `<image:image>` entry so
 *     Google Images can index the cover. Reference: https://www.google.com/schemas/sitemap-image/1.1
 *
 * Reference: https://www.sitemaps.org/protocol.html
 *
 * Add a new static entry to {@linkcode STATIC_ROUTES} when a new public page
 * is published. Blog article entries are added dynamically from the content
 * collection at build time.
 */

import type { APIRoute } from 'astro';
import { getAllArticles, getArticleUrl } from '../lib/blog';
import { BLOG_CATEGORIES } from '../../keystatic.config';

const SITE_URL = 'https://ftci.fr';

interface SitemapImage {
	/** URL absolue de l'image (cover d'article). */
	loc: string;
	/** Légende/titre affiché dans Google Images. */
	title?: string;
}

interface SitemapEntry {
	loc: string;
	lastmod?: string;
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority?: number;
	images?: SitemapImage[];
}

// Routes statiques — pas de `lastmod` (recommandation Google : ne pas ajouter
// lastmod juste pour la forme ; les valeurs `today` changeaient à chaque build
// et étaient ignorées par Google. Les moteurs utilisent If-Modified-Since.)
const STATIC_ROUTES: SitemapEntry[] = [
	{
		loc: '/',
		changefreq: 'weekly',
		priority: 1.0,
	},
	{
		loc: '/blog',
		changefreq: 'daily',
		priority: 0.9,
	},
	// One entry per blog category (6 categories).
	...BLOG_CATEGORIES.map((cat) => ({
		loc: `/blog/categorie/${cat.value}`,
		changefreq: 'weekly' as const,
		priority: 0.7,
	})),
	{
		loc: '/legal/mentions-legales',
		changefreq: 'yearly' as const,
		priority: 0.3,
	},
	{
		loc: '/legal/confidentialite',
		changefreq: 'yearly' as const,
		priority: 0.3,
	},
	{
		loc: '/legal/cgu',
		changefreq: 'yearly' as const,
		priority: 0.3,
	},
];

/**
 * Escapes the 5 XML special characters. Used for `<image:title>` values which
 * come from user-edited article titles and may contain `&`, `<`, etc.
 * URLs are already URL-encoded and don't need XML escaping (except `&` in
 * query strings, which is rare for sitemap entries).
 */
function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Builds the full sitemap by combining static routes with one entry per
 * published blog article (dynamic, fetched from the content collection).
 * Article entries include `<lastmod>` (updatedAt ?? publishedAt) and an
 * `<image:image>` block when a cover image is present.
 */
async function buildAllRoutes(): Promise<SitemapEntry[]> {
	const articles = await getAllArticles();
	const articleRoutes: SitemapEntry[] = articles.map((entry) => {
		const lastmodDate = entry.data.updatedAt ?? entry.data.publishedAt;
		const images: SitemapImage[] = [];
		if (entry.data.coverImage) {
			images.push({
				loc: entry.data.coverImage.startsWith('http')
					? entry.data.coverImage
					: `${SITE_URL}${entry.data.coverImage}`,
				title: entry.data.title,
			});
		}
		return {
			loc: getArticleUrl(entry),
			lastmod: lastmodDate.toISOString().split('T')[0],
			changefreq: 'monthly',
			priority: 0.8,
			images: images.length > 0 ? images : undefined,
		};
	});
	return [...STATIC_ROUTES, ...articleRoutes];
}

/**
 * Serializes `routes` into a sitemaps.org-compliant `<urlset>` document.
 *
 * Each `<url>` includes `<loc>` plus any of `<lastmod>`, `<changefreq>`,
 * `<priority>`, and zero or more `<image:image>` blocks that the entry
 * defines. `priority` is formatted with one decimal to match the spec
 * example output.
 */
function buildSitemapXml(routes: SitemapEntry[]): string {
	const urlElements = routes
		.map((route) => {
			const url = `${SITE_URL}${route.loc}`;
			const lastmod = route.lastmod ? `\n    <lastmod>${route.lastmod}</lastmod>` : '';
			const changefreq = route.changefreq
				? `\n    <changefreq>${route.changefreq}</changefreq>`
				: '';
			const priority =
				route.priority !== undefined
					? `\n    <priority>${route.priority.toFixed(1)}</priority>`
					: '';
			const images = route.images
				? route.images
						.map((img) => {
							const title = img.title
								? `\n      <image:title>${escapeXml(img.title)}</image:title>`
								: '';
							return `\n    <image:image>\n      <image:loc>${escapeXml(img.loc)}</image:loc>${title}\n    </image:image>`;
						})
						.join('')
				: '';
			return `  <url>\n    <loc>${escapeXml(url)}</loc>${lastmod}${changefreq}${priority}${images}\n  </url>`;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlElements}
</urlset>`;
}

/**
 * GET /sitemap.xml — serves the prerendered XML with a 1-hour cache and
 * `X-Robots-Tag: noindex` so search engines index the linked pages, not the
 * sitemap itself.
 */
export const GET: APIRoute = async () => {
	const routes = await buildAllRoutes();
	const xml = buildSitemapXml(routes);
	return new Response(xml, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
			'X-Robots-Tag': 'noindex',
		},
	});
};
