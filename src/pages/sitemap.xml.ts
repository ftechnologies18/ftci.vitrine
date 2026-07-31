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

interface SitemapEntry {
	loc: string;
	lastmod?: string;
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority?: number;
}

const today = new Date().toISOString().split('T')[0];

const STATIC_ROUTES: SitemapEntry[] = [
	{
		loc: '/',
		lastmod: today,
		changefreq: 'weekly',
		priority: 1.0,
	},
	{
		loc: '/blog',
		lastmod: today,
		changefreq: 'daily',
		priority: 0.9,
	},
	// One entry per blog category (6 categories).
	...BLOG_CATEGORIES.map((cat) => ({
		loc: `/blog/categorie/${cat.value}`,
		lastmod: today,
		changefreq: 'weekly' as const,
		priority: 0.7,
	})),
	{
		loc: '/legal/mentions-legales',
		lastmod: today,
		changefreq: 'yearly' as const,
		priority: 0.3,
	},
	{
		loc: '/legal/confidentialite',
		lastmod: today,
		changefreq: 'yearly' as const,
		priority: 0.3,
	},
	{
		loc: '/legal/cgu',
		lastmod: today,
		changefreq: 'yearly' as const,
		priority: 0.3,
	},
];

/**
 * Builds the full sitemap by combining static routes with one entry per
 * published blog article (dynamic, fetched from the content collection).
 */
async function buildAllRoutes(): Promise<SitemapEntry[]> {
	const articles = await getAllArticles();
	const articleRoutes: SitemapEntry[] = articles.map((entry) => ({
		loc: getArticleUrl(entry),
		lastmod: entry.data.publishedAt.toISOString().split('T')[0],
		changefreq: 'monthly',
		priority: 0.8,
	}));
	return [...STATIC_ROUTES, ...articleRoutes];
}

/**
 * Serializes `routes` into a sitemaps.org-compliant `<urlset>` document.
 *
 * Each `<url>` includes `<loc>` plus any of `<lastmod>`, `<changefreq>`,
 * `<priority>` that the entry defines. `priority` is formatted with one
 * decimal to match the spec example output.
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
			return `  <url>\n    <loc>${url}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
