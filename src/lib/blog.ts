/**
 * Shared data-access layer for the FTCI blog.
 *
 * Wraps the Astro Content Collections `getCollection('blog')` API with the
 * FTCI-specific helpers every blog page needs: draft filtering (hidden in
 * production, visible in dev), sorting by publication date (newest first),
 * category filtering, featured extraction, and reading-time fallback.
 *
 * Importing from this module instead of calling `getCollection` directly keeps
 * the filtering rules consistent across `index.astro`, `[slug].astro`,
 * `categorie/[category].astro`, `RelatedArticles.astro`, and `rss.xml.ts`.
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORY_LABELS, type BlogCategory } from '../../keystatic.config';

export type BlogEntry = CollectionEntry<'blog'>;

/**
 * Returns true when drafts should be visible. In production (`import.meta.env.PROD`)
 * drafts are filtered out; in dev (`import.meta.env.DEV`) they are kept so the
 * editor can preview them.
 */
const shouldShowDrafts = import.meta.env.DEV;

/**
 * Returns every published blog entry, sorted newest-first by `publishedAt`.
 *
 * Drafts (`draft: true`) are filtered out in production but kept in dev. The
 * sort is stable on `publishedAt` then on `id` for deterministic ordering.
 */
export async function getAllArticles(): Promise<BlogEntry[]> {
	const all = await getCollection('blog');
	return all
		.filter((entry) => shouldShowDrafts || !entry.data.draft)
		.sort((a, b) => {
			const da = a.data.publishedAt.getTime();
			const db = b.data.publishedAt.getTime();
			if (db !== da) return db - da;
			return a.id.localeCompare(b.id);
		});
}

/**
 * Returns the articles flagged as `featured: true`, sorted newest-first.
 * Useful for the hero section of the blog index page.
 */
export async function getFeaturedArticles(): Promise<BlogEntry[]> {
	const all = await getAllArticles();
	return all.filter((entry) => entry.data.featured);
}

/**
 * Returns articles in the given category slug, sorted newest-first.
 * Returns an empty array if the category slug is unknown.
 */
export async function getArticlesByCategory(category: string): Promise<BlogEntry[]> {
	const all = await getAllArticles();
	return all.filter((entry) => entry.data.category === category);
}

/**
 * Returns up to `limit` articles related to `current`, excluding itself.
 * Matching priority: same category first, then any other published article.
 */
export async function getRelatedArticles(current: BlogEntry, limit = 3): Promise<BlogEntry[]> {
	const all = await getAllArticles();
	const others = all.filter((entry) => entry.id !== current.id);

	const sameCategory = others.filter((entry) => entry.data.category === current.data.category);
	const differentCategory = others.filter((entry) => entry.data.category !== current.data.category);

	return [...sameCategory, ...differentCategory].slice(0, limit);
}

/**
 * Returns a single article by its slug (the file name without extension), or
 * `undefined` if not found or if it's a draft hidden in production.
 */
export async function getArticleBySlug(slug: string): Promise<BlogEntry | undefined> {
	const all = await getCollection('blog');
	const entry = all.find((e) => e.id === slug || e.id === `${slug}.md`);
	if (!entry) return undefined;
	if (!shouldShowDrafts && entry.data.draft) return undefined;
	return entry;
}

/**
 * Returns the human-readable label for a category slug, falling back to the
 * slug itself if unknown (defensive — should never happen with valid data).
 */
export function getCategoryLabel(slug: string): string {
	return CATEGORY_LABELS[slug] ?? slug;
}

/**
 * Returns the list of all categories as `{ slug, label, count }` tuples,
 * sorted by descending article count then alphabetically. Useful for the
 * blog sidebar / filters UI.
 */
export async function getCategoriesWithCounts(): Promise<
	{ slug: BlogCategory; label: string; count: number }[]
> {
	const all = await getAllArticles();
	const counts = new Map<string, number>();
	for (const article of all) {
		const c = article.data.category;
		counts.set(c, (counts.get(c) ?? 0) + 1);
	}
	return (Object.entries(CATEGORY_LABELS) as [string, string][])
		.map(([slug, label]) => ({
			slug: slug as BlogCategory,
			label,
			count: counts.get(slug) ?? 0,
		}))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * Returns a best-effort reading time in minutes. Uses the article's
 * `readingTime` frontmatter if set, otherwise estimates from word count
 * (≈200 words/minute in French).
 */
export function getReadingTime(entry: BlogEntry): number {
	if (entry.data.readingTime) return entry.data.readingTime;
	// The rendered content is available after `render(entry)`, but for a
	// cheap estimate we count words in the raw body if present.
	const body = (entry.body as string | undefined) ?? '';
	const wordCount = body.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(wordCount / 200));
}

/**
 * Returns the absolute URL of an article on the production site, used for
 * canonical links, Open Graph tags, and the RSS feed.
 */
export function getArticleUrl(entry: BlogEntry): string {
	return `/blog/${entry.id.replace(/\.md$/, '')}`;
}

/**
 * Returns the absolute URL of a category page on the production site.
 */
export function getCategoryUrl(slug: string): string {
	return `/blog/categorie/${slug}`;
}
