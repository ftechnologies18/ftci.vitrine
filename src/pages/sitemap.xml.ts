/**
 * Endpoint dynamique : /sitemap.xml
 *
 * Génère le sitemap XML standard pour les moteurs de recherche.
 * Liste toutes les pages publiques indexables du site.
 *
 * Référence : https://www.sitemaps.org/protocol.html
 *
 * Pour ajouter une page, ajouter une entrée dans la constante ROUTES ci-dessous.
 */

import type { APIRoute } from 'astro';
import { products, productUrls } from '../data/products';

const SITE_URL = 'https://ftci.fr';

interface SitemapEntry {
	loc: string;
	lastmod?: string;
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority?: number; // 0.0 - 1.0
}

// Date actuelle pour lastmod
const today = new Date().toISOString().split('T')[0];

const ROUTES: SitemapEntry[] = [
	{
		loc: '/',
		lastmod: today,
		changefreq: 'weekly',
		priority: 1.0,
	},
	// Pages produits
	...products.map((p) => ({
		loc: productUrls[p.slug],
		lastmod: today,
		changefreq: 'monthly' as const,
		priority: 0.9,
	})),
	// Pages légales (priorité basse mais indexées)
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

export const GET: APIRoute = () => {
	const xml = buildSitemapXml(ROUTES);
	return new Response(xml, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
			'X-Robots-Tag': 'noindex', // Le sitemap lui-même ne doit pas être indexé
		},
	});
};
