/**
 * `/sitemap.xml` endpoint for the FTCI vitrine.
 *
 * Emits the sitemaps.org XML protocol listing every public indexable page:
 * home and the three legal pages. The per-product solution pages
 * (`/solutions/*`) have been removed — the products now live on their own
 * subdomains (sect.ftci.fr, opuc.ftci.fr, cats.ftci.fr, scolagest.ftci.fr)
 * and are linked directly from the footer/home, so they are not part of
 * this site's own sitemap. Astro prerenders the route at build time, so the
 * URL set is fixed per deploy.
 *
 * Reference: https://www.sitemaps.org/protocol.html
 *
 * Add a new entry to {@linkcode ROUTES} when a new public page is published.
 */

import type { APIRoute } from 'astro';

const SITE_URL = 'https://ftci.fr';

interface SitemapEntry {
	loc: string;
	lastmod?: string;
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority?: number;
}

const today = new Date().toISOString().split('T')[0];

const ROUTES: SitemapEntry[] = [
	{
		loc: '/',
		lastmod: today,
		changefreq: 'weekly',
		priority: 1.0,
	},
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
			const changefreq = route.changefreq ? `\n    <changefreq>${route.changefreq}</changefreq>` : '';
			const priority = route.priority !== undefined ? `\n    <priority>${route.priority.toFixed(1)}</priority>` : '';
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
export const GET: APIRoute = () => {
	const xml = buildSitemapXml(ROUTES);
	return new Response(xml, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
			'X-Robots-Tag': 'noindex',
		},
	});
};
