/**
 * Endpoint dynamique : /robots.txt
 *
 * Astro génère ce fichier à l'build. En dev, accessible via GET /robots.txt.
 * Permet de guider les crawlers des moteurs de recherche.
 *
 * Production : généré statiquement (prerender = true par défaut sur les endpoints GET).
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

# Crawl-delay (politique de politesse)
Crawl-delay: 1

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

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
