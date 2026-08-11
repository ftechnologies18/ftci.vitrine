/**
 * Schema.org JSON-LD generators for FTCI structured data.
 *
 * Each builder returns a plain object (or array of objects) ready to be
 * passed to the `<SEO schema={...} />` component, which serializes it via
 * `safeJsonStringify` (anti-XSS `</script>` escaping).
 *
 * Reference: https://schema.org/docs/full.html
 *
 * Design rules:
 *   - Pure functions, no side effects, no I/O. Safe to call at build time.
 *   - `siteUrl` is passed explicitly (single source of truth: 'https://ftci.fr').
 *   - All entities reference the FTCI Organization as publisher/provider to
 *     establish the `@id` graph linkage Google uses for the Knowledge Panel.
 */

import type { Product } from '../data/products';
import type { Service } from '../data/services';
import type { FaqItem } from '../data/faq';

const SITE_URL = 'https://ftci.fr';
const ORG_ID = `${SITE_URL}/#organization`;

/** Reusable Organization reference node (for `@id` linkage across entities). */
export const organizationReference = {
	'@type': 'Organization',
	'@id': ORG_ID,
	name: 'FTCI',
} as const;

/**
 * Builds a schema.org `SoftwareApplication` entity for a FTCI SaaS product.
 *
 * Rich snippet eligibility (Google): requires `name`, `operatingSystem` or
 * `applicationCategory`, and ideally `offers` or `aggregateRating`. We omit
 * `offers` because the four SaaS are B2B with custom pricing — emitting
 * inaccurate price data would be a spam signal. The entity still contributes
 * to the Knowledge Graph and entity disambiguation.
 *
 * Reference: https://schema.org/SoftwareApplication
 */
export function buildSoftwareApplicationSchema(product: Product): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: product.name,
		alternateName: product.fullName,
		description: product.description,
		url: product.externalUrl || `${SITE_URL}/#solutions`,
		applicationCategory: product.category,
		operatingSystem: 'Web',
		inLanguage: 'fr-FR',
		publisher: organizationReference,
		provider: organizationReference,
		featureList: product.features.map((f) => f.title),
		keywords: product.keywords.join(', '),
		audience: {
			'@type': 'Audience',
			audienceType: product.targetAudience,
		},
		about: product.useCases.map((uc) => ({
			'@type': 'Thing',
			name: uc.sector,
			description: uc.scenario,
		})),
	};
}

/**
 * Builds schema.org `Service` entities for the four FTCI service poles.
 *
 * Each service references the FTCI Organization as `provider` and exposes its
 * sub-offerings via an `OfferCatalog`. `areaServed` reflects the geographic
 * reach of the ESN.
 *
 * Reference: https://schema.org/Service
 */
export function buildServiceSchema(service: Service): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'Service',
		name: service.title,
		serviceType: service.title,
		description: service.description,
		url: `${SITE_URL}/#services`,
		provider: organizationReference,
		areaServed: ["Côte d'Ivoire", "Afrique de l'Ouest", 'Afrique'],
		inLanguage: 'fr-FR',
		audience: {
			'@type': 'Audience',
			audienceType: service.targetAudience,
		},
		keywords: service.keywords.join(', '),
		hasOfferCatalog: {
			'@type': 'OfferCatalog',
			name: `Catalogue ${service.title}`,
			itemListElement: service.items.map((item) => ({
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: item,
					provider: organizationReference,
				},
			})),
		},
	};
}

/**
 * Builds a schema.org `FAQPage` entity from the structured FAQ data.
 *
 * Google displays FAQ rich snippets directly in search results when the
 * questions and answers are also visible on the page (not JSON-LD only). The
 * FAQ data lives in `src/data/faq.ts` and should be rendered in a visible UI
 * section — otherwise this JSON-LD is a spam signal.
 *
 * Reference: https://schema.org/FAQPage
 */
export function buildFaqSchema(faqItems: FaqItem[]): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqItems.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer,
			},
		})),
	};
}
