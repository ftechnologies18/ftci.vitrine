/**
 * Astro 7 Content Layer API config for the FTCI blog.
 *
 * Defines the `blog` collection using the `glob` loader, which loads every
 * Markdown file under `src/content/blog/` at build time. Each article's
 * frontmatter must validate against the `z` schema below — this mirrors the
 * Keystatic schema in `keystatic.config.ts` so the two stay in sync.
 *
 * To add a new article: create a `.md` file in `src/content/blog/` with the
 * frontmatter fields below, or use the Keystatic UI at `/keystatic` in
 * production.
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load every Markdown/Markdoc file under src/content/blog/
	// Supports both .md (Astro Markdown, used for seed articles) and .mdoc
	// (Markdoc, written by Keystatic's fields.markdoc when editing in prod).
	loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/blog' }),

	// Frontmatter schema — must match keystatic.config.ts blog collection.
	schema: z.object({
		title: z.string().min(5).max(120),
		description: z.string().min(50).max(160),
		category: z.enum([
			'transformation-digitale',
			'intelligence-artificielle',
			'cloud-computing',
			'cybersecurite',
			'tech-innovation',
			'actualites-ftci',
		]),
		tags: z.array(z.string()).default([]),
		publishedAt: z.coerce.date(),
		author: z.string().default('Freelance Technologies CI'),
		coverImage: z.string().optional(),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
		readingTime: z.number().int().positive().optional(),
	}),
});

export const collections = { blog };
