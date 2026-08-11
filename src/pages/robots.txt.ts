/**
 * `/robots.txt` endpoint for the FTCI vitrine.
 *
 * Serves a static robots.txt that lets search engines and AI crawlers index
 * the public pages while keeping `/api/` and `/storage/` private. Per-bot
 * rules at the end of the file allow known AI assistants (GPTBot, ClaudeBot,
 * etc.) and block aggressive SEO scrapers (AhrefsBot, SemrushBot) that FTCI
 * does not benefit from. Astro prerenders the route at build time.
 */

import type { APIRoute } from 'astro';

const SITE_URL = 'https://ftci.fr';

const robotsTxt = `# robots.txt — FTCI — Freelance Technologies Côte d'Ivoire
# https://ftci.fr

# Tous les crawlers autorisés
User-agent: *

# Pages autorisées à l'indexation (par défaut, tout est autorisé)
# Pages bloquées explicitement :
Disallow: /api/
Disallow: /storage/

# Liens vers les sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

# Bots IA / scraping — autorisés sur le contenu public
# (FTCI autorise l'indexation par les moteurs de recherche et assistants IA
# à des fins de référence, conformément aux lois applicables)
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

# Bots malveillants connus — bloqués
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: MJ12bot
Disallow: /
`;

/** GET /robots.txt — serves the prerendered text with a 1-hour cache. */
export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
