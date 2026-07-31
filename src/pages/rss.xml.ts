/**
 * /rss.xml — Flux RSS 2.0 du blog FTCI.
 *
 * Sert un document XML RSS 2.0 listant les 20 derniers articles publiés. Les
 * lecteurs de flux (Feedly, Netvibes, Outlook, etc.) peuvent s'y abonner pour
 * recevoir les nouveaux articles automatiquement.
 *
 * Référence spec : https://www.rssboard.org/rss-specification
 *
 * Astro prérend cette route au build (XML statique), donc la liste est fixe
 * par déploiement et régénérée à chaque `git push` sur main.
 */

import type { APIRoute } from 'astro';
import { getAllArticles, getArticleUrl, getCategoryLabel } from '../lib/blog';

const SITE_URL = 'https://ftci.fr';
const FEED_TITLE = 'Blog FTCI — Transformation digitale, IA, Cloud & Cybersécurité';
const FEED_DESCRIPTION =
	"Analyses, expertises et actualités de Freelance Technologies Côte d'Ivoire — transformation digitale, intelligence artificielle, cloud, cybersécurité et innovation technologique en Afrique.";

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
	const articles = (await getAllArticles()).slice(0, 20);

	const itemsXml = articles
		.map((entry) => {
			const url = `${SITE_URL}${getArticleUrl(entry)}`;
			const pubDate = entry.data.publishedAt.toUTCString();
			const category = getCategoryLabel(entry.data.category);
			const description = escapeXml(entry.data.description);
			const title = escapeXml(entry.data.title);
			const author = escapeXml(entry.data.author);
			const coverImage = entry.data.coverImage
				? entry.data.coverImage.startsWith('http')
					? entry.data.coverImage
					: `${SITE_URL}${entry.data.coverImage}`
				: '';

			return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${author}</dc:creator>
      <category>${escapeXml(category)}</category>
      <description>${description}</description>
      ${coverImage ? `<enclosure url="${escapeXml(coverImage)}" type="image/jpeg" length="0" />\n      ` : ''}<comments>${url}</comments>
    </item>`;
		})
		.join('\n');

	const lastBuildDate = articles[0]?.data.publishedAt.toUTCString() ?? new Date().toUTCString();

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>fr-FR</language>
    <copyright>© ${new Date().getFullYear()} Freelance Technologies Côte d'Ivoire. Tous droits réservés.</copyright>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Astro + FTCI custom RSS generator</generator>
    <image>
      <url>${SITE_URL}/brand/logo-ftci.png</url>
      <title>${escapeXml(FEED_TITLE)}</title>
      <link>${SITE_URL}/blog</link>
      <width>144</width>
      <height>150</height>
    </image>
${itemsXml}
  </channel>
</rss>`;

	return new Response(xml, {
		status: 200,
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
			'X-Robots-Tag': 'noindex',
		},
	});
};
