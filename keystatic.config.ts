/**
 * Keystatic configuration for the FTCI blog.
 *
 * Storage strategy:
 *   - Local development (`astro dev`) → `local` mode: reads/writes files
 *     directly on disk via the Keystatic Astro integration. Used by developers
 *     to author content while coding.
 *   - Production (Cloudflare Workers) → `github` mode: the Keystatic UI at
 *     `/keystatic` authenticates the editor via GitHub OAuth and commits
 *     content changes directly to the `ftechnologies18/ftci.vitrine` repo.
 *     Each save creates a commit on `main`, which triggers Cloudflare Workers
 *     Builds to redeploy the site. This lets non-developers edit the blog
 *     without touching code or using a terminal.
 *
 * Required Cloudflare secrets for `github` mode (set via `wrangler secret put`):
 *   - KEYSTATIC_GITHUB_CLIENT_ID     — GitHub OAuth App client ID
 *   - KEYSTATIC_GITHUB_CLIENT_SECRET — GitHub OAuth App client secret
 *   - KEYSTATIC_SECRET               — random 32+ char string used to sign
 *                                      session cookies (run `openssl rand -hex 32`)
 *
 * GitHub OAuth App setup (one-time, ~5 min):
 *   1. https://github.com/settings/developers → "New OAuth App"
 *   2. Homepage URL: https://ftci.fr
 *   3. Authorization callback URL: https://ftci.fr/api/keystatic/github/oauth/callback
 *   4. Generate client secret, then bind both as Worker secrets.
 *
 * The single collection `blog` holds every article. Each article is a Markdown
 * file under `src/content/blog/`. The `category` field is a select with the
 * 6 FTCI editorial categories — the editor just picks one, no need to
 * manipulate folders or filenames.
 */

import { config, fields, collection, singleton } from '@keystatic/core';

/**
 * The 6 editorial categories of the FTCI blog. Order matters — it is the
 * display order in Keystatic's select dropdown and on the blog index page.
 *
 * `value` is the slug used in URLs (`/blog/categorie/<value>`) and as the
 * frontmatter `category` value. `label` is the human-readable name shown to
 * the editor and on the site.
 */
export const BLOG_CATEGORIES = [
        { value: 'transformation-digitale', label: 'Transformation digitale' },
        { value: 'intelligence-artificielle', label: 'Intelligence artificielle' },
        { value: 'cloud-computing', label: 'Cloud & infrastructures' },
        { value: 'cybersecurite', label: 'Cybersécurité' },
        { value: 'tech-innovation', label: 'Tech & Innovation' },
        { value: 'actualites-ftci', label: 'Actualités FTCI' },
] as const;

/** Lookup table from category slug to human-readable label. */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
        BLOG_CATEGORIES.map((c) => [c.value, c.label]),
);

/** Convenience type for a category slug. */
export type BlogCategory = (typeof BLOG_CATEGORIES)[number]['value'];

/**
 * Keystatic storage: `local` in dev, `github` in production.
 *
 * We detect production via `process.env.NODE_ENV` (set to `'production'` by
 * Cloudflare Workers Builds). Keystatic's `github` mode reads the OAuth
 * credentials at runtime from the Cloudflare env (`KEYSTATIC_GITHUB_CLIENT_ID`,
 * `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`) — these are Worker
 * secrets, NOT build-time env vars, so we must not check them here (they would
 * be undefined at build time on Workers Builds and crash the config).
 *
 * If the OAuth secrets are not yet bound, the `/keystatic` route returns an
 * error at runtime, but the rest of the site (including the blog read side)
 * keeps working.
 */
const isProd = process.env.NODE_ENV === 'production';

export default config({
        storage: isProd
                ? {
                        kind: 'github',
                        repo: {
                                owner: 'ftechnologies18',
                                name: 'ftci.vitrine',
                        },
                        branchPrefix: 'keystatic/',
                }
                : { kind: 'local' },

        collections: {
                blog: collection({
                        label: 'Articles de blog',
                        path: 'src/content/blog/*',
                        slugField: 'title',
                        entryLayout: 'content',
                        format: { contentField: 'content' },
                        columns: ['title', 'category', 'publishedAt'],
                        schema: {
                                title: fields.slug({
                                        name: {
                                                label: 'Titre',
                                                validation: { length: { min: 5, max: 120 } },
                                        },
                                }),
                                description: fields.text({
                                        label: 'Description (SEO — meta description, 50-160 caractères)',
                                        validation: { length: { min: 50, max: 160 } },
                                        multiline: true,
                                }),
                                category: fields.select({
                                        label: 'Catégorie',
                                        options: BLOG_CATEGORIES,
                                        defaultValue: 'transformation-digitale',
                                }),
                                tags: fields.array(
                                        fields.text({ label: 'Tag' }),
                                        {
                                                label: 'Tags',
                                                itemLabel: (props) => props.value,
                                        },
                                ),
                                publishedAt: fields.date({
                                        label: 'Date de publication',
                                        validation: { isRequired: true },
                                }),
                                author: fields.text({
                                        label: 'Auteur',
                                        defaultValue: 'Freelance Technologies CI',
                                        validation: { isRequired: true },
                                }),
                                coverImage: fields.image({
                                        label: 'Image de couverture',
                                        directory: 'public/blog/images',
                                        publicPath: '/blog/images/',
                                        validation: { isRequired: false },
                                }),
                                featured: fields.checkbox({
                                        label: 'Article à la une (mis en avant sur la page d\'accueil du blog)',
                                        defaultValue: false,
                                }),
                                draft: fields.checkbox({
                                        label: 'Brouillon (masqué en production, visible en preview)',
                                        defaultValue: false,
                                }),
                                readingTime: fields.integer({
                                        label: 'Temps de lecture (minutes, optionnel — auto si vide)',
                                        defaultValue: 5,
                                        validation: { isRequired: false },
                                }),
                                content: fields.markdoc({
                                        label: 'Contenu',
                                        options: {
                                                image: {
                                                        directory: 'public/blog/images',
                                                        publicPath: '/blog/images/',
                                                },
                                        },
                                }),
                        },
                }),
        },

        singletons: {
                // Reserved for future use (e.g. blog settings, featured articles order).
        },
});
