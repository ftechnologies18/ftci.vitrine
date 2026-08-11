/**
 * Single source of truth for the four FTCI service poles (Conseil /
 * Développement / Infrastructure / Formation).
 *
 * Consumed by the home Services section (src/components/Services.astro) and by
 * the schema.org `Service` JSON-LD blocks (src/lib/structured-data.ts). Editing
 * a service here propagates to every surface that imports {@linkcode services}.
 *
 * To add a service: extend {@linkcode ServiceSlug}, append to {@linkcode services},
 * and update the corresponding UI + structured-data generators.
 */

import type { Product } from './products';

export type ServiceSlug =
	| 'transformation-digitale'
	| 'developpement-web'
	| 'infrastructure-it'
	| 'tech-assistance-formation';

export interface Service {
	/** Identifiant court utilisé pour les ancres et le JSON-LD `serviceType`. */
	slug: ServiceSlug;
	/** Numéro d'affichage (01, 02, 03, 04) — purement visuel. */
	num: string;
	/** Titre public affiché dans la timeline. */
	title: string;
	/** Couleur d'accent (classe Tailwind) — partagée avec le système produit. */
	color: Product['accentColor'];
	/** Classes Tailwind pour le gradient du cercle numéroté. */
	gradient: string;
	/** Classe Tailwind pour la couleur de texte. */
	text: string;
	/** Description courte (SEO + UI). */
	description: string;
	/** Sous-prestations affichées en liste à puces. */
	items: string[];
	/** Icône SVG path (Heroicons outline). */
	iconPath: string;
	/** Mots-clés SEO pour le JSON-LD `Service`. */
	keywords: string[];
	/** Audience cible pour le JSON-LD `audience`. */
	targetAudience: string;
}

/**
 * Ordered catalogue of the four FTCI service poles. Order matters for the home
 * page timeline and the JSON-LD emission order. Keep aligned with
 * {@linkcode ServiceSlug} when reordering.
 */
export const services: Service[] = [
	{
		num: '01',
		slug: 'transformation-digitale',
		title: 'Transformation Digitale',
		color: 'orange',
		gradient: 'from-orange to-orange-600',
		text: 'text-orange',
		description:
			"Nous accompagnons les organisations dans leur migration vers le numérique — de l'audit initial à la conduite du changement.",
		items: ['Audit & diagnostic', 'Roadmap stratégique', 'Gestion du changement'],
		iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
		keywords: [
			'transformation digitale',
			'audit numérique',
			'roadmap stratégique',
			'conduite du changement',
			"ESN Côte d'Ivoire",
		],
		targetAudience: 'PME, grandes entreprises, administrations publiques',
	},
	{
		num: '02',
		slug: 'developpement-web',
		title: 'Développement Web sur Mesure',
		color: 'periwinkle',
		gradient: 'from-periwinkle to-periwinkle-600',
		text: 'text-periwinkle',
		description:
			'Applications web et mobiles, API et PWA conçues sur mesure pour vos processus métiers et vos contraintes locales.',
		items: ['PWA & applications', 'API & intégrations', 'Support & maintenance'],
		iconPath: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
		keywords: [
			'développement web sur mesure',
			'application mobile Afrique',
			'PWA progressive web app',
			'API REST intégrations',
			'développement Abidjan',
		],
		targetAudience: 'Startups, PME, groupes industriels, acteurs publics',
	},
	{
		num: '03',
		slug: 'infrastructure-it',
		title: 'Infrastructure IT',
		color: 'green',
		gradient: 'from-green to-green-600',
		text: 'text-green',
		description:
			"Conception, déploiement et sécurisation de votre infrastructure cloud et on-premise, avec continuité d'activité garantie.",
		items: ['Cloud & hybridation', 'Sécurité & conformité', 'Disaster recovery'],
		iconPath: 'M5 12H3l8-8 8 8h-2M5 12v7a1 1 0 001 1h3v-5h4v5h3a1 1 0 001-1v-7',
		keywords: [
			'infrastructure IT',
			'cloud computing Afrique',
			'sécurité informatique',
			'disaster recovery',
			"DevOps Côte d'Ivoire",
		],
		targetAudience: 'Entreprises cloud, administrations, datacenters',
	},
	{
		num: '04',
		slug: 'tech-assistance-formation',
		title: 'Tech Assistance & Formation',
		color: 'orange',
		gradient: 'from-orange to-orange-600',
		text: 'text-orange',
		description:
			"L'assistance technique vous aide à résoudre les problèmes liés au matériel informatique, aux logiciels et aux réseaux. Formations pratiques : systèmes d'exploitation, bureautique, sécurité informatique, travail collaboratif, Intelligence Artificielle et développement.",
		items: [
			'Assistance technique hardware & software',
			'Formations IT & IA',
			'Support réseau & sécurité',
		],
		iconPath:
			'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
		keywords: [
			'assistance technique IT',
			'formation informatique',
			'formation intelligence artificielle',
			'support réseau sécurité',
			'formation Abidjan',
		],
		targetAudience: 'Entreprises, particuliers, étudiants, organismes de formation',
	},
];
