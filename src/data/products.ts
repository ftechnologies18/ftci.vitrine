/**
 * Single source of truth for the four FTCI SaaS products (SECT, OPUC, CATS,
 * ScolaGest) and their derived lookup tables.
 *
 * Consumed by the home Products section, the per-product solution pages
 * (`/src/pages/solutions/*.astro`), the sitemap, and the schema.org JSON-LD
 * blocks. Editing a product here propagates to every surface that imports
 * {@linkcode products}, {@linkcode productMap}, {@linkcode productUrls}, or
 * {@linkcode accentColorClasses}.
 *
 * To add a product: extend {@linkcode ProductSlug}, append to {@linkcode products},
 * and add the matching entry to {@linkcode productUrls} and
 * {@linkcode accentColorClasses}.
 */

export type ProductSlug = 'sect' | 'opuc' | 'cats' | 'scolagest';

export interface ProductFeature {
        title: string;
        description: string;
}

export interface ProductUseCase {
        sector: string;
        scenario: string;
}

export interface Product {
        slug: ProductSlug;
        name: string;
        fullName: string;
        tagline: string;
        description: string;
        longDescription: string;
        /** Domaine externe du produit déployé (laisser vide si non déployé) */
        externalUrl: string;
        /** Couleur d'accent (classe Tailwind ou hex) */
        accentColor: 'orange' | 'green' | 'periwinkle' | 'navy';
        /** Icône SVG path (Heroicons outline) */
        iconPath: string;
        /** Catégorie pour le SEO */
        category: string;
        /** Mots-clés SEO */
        keywords: string[];
        features: ProductFeature[];
        useCases: ProductUseCase[];
        benefits: string[];
        targetAudience: string;
}

/**
 * Ordered catalogue of the four FTCI SaaS products. Order matters for the
 * home page grid, the sitemap, and the products nav block. Keep the array
 * index aligned with {@linkcode ProductSlug} when reordering.
 */
export const products: Product[] = [
        {
                slug: 'sect',
                name: 'SECT',
                fullName: "Système d'Évaluation par Contrôle Technologique",
                tagline: "L'évaluation universitaire réinventée par l'IA",
                description:
                        "Plateforme d'évaluation par IA pour universités africaines. Génération de sujets, surveillance anti-fraude, correction automatique.",
                longDescription:
                        "SECT est une plateforme d'évaluation de nouvelle génération qui s'appuie sur l'intelligence artificielle pour concevoir, administrer et corriger des examens universitaires. Pensée pour le contexte africain, elle intègre un système de surveillance anti-fraude robuste, une génération automatique de sujets personnalisés, et une correction intelligente qui libère les enseignants des tâches chronophages. SECT garantit l'intégrité académique tout en offrant une expérience fluide aux étudiants et aux administrateurs.",
                externalUrl: 'https://sect.ftci.fr',
                accentColor: 'orange',
                iconPath:
                        'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5h.01v.01H12v-.01z',
                category: 'Évaluation académique',
                keywords: [
                        'évaluation universitaire IA',
                        'examen en ligne Afrique',
                        'anti-fraude examen',
                        'correction automatique',
                        'université numérique Côte d\'Ivoire',
                ],
                features: [
                        {
                                title: "Génération de sujets par IA",
                                description:
                                        "Création automatique de sujets d'examen personnalisés à partir d'une banque de questions, avec variantes pour limiter la triche entre étudiants.",
                        },
                        {
                                title: "Surveillance anti-fraude",
                                description:
                                        "Détection des comportements suspects (changement d'onglet, sortie d'écran, présence de plusieurs visages) pendant l'examen.",
                        },
                        {
                                title: "Correction automatique",
                                description:
                                        "Notation intelligente des réponses (QCM, questions ouvertes) avec retour pédagogique personnalisé pour l'étudiant.",
                        },
                        {
                                title: "Tableaux de bord temps réel",
                                description:
                                        "Suivi de l'avancement des examens, statistiques de réussite, détection des questions problématiques en direct.",
                        },
                        {
                                title: "Gestion multi-sites",
                                description:
                                        "Organisation des examens simultanés sur plusieurs campus, salles et fuseaux horaires avec synchronisation centralisée.",
                        },
                        {
                                title: "Conformité RGPD & HDS",
                                description:
                                        "Chiffrement bout-en-bout des données, hébergement sécurisé, et respect des exigences de protection des données étudiantes.",
                        },
                ],
                useCases: [
                        {
                                sector: 'Universités',
                                scenario:
                                        "Organisation d'examens semestriels pour 5 000 étudiants simultanés avec garantie d'intégrité académique.",
                        },
                        {
                                sector: "Écoles d'ingénieurs",
                                scenario:
                                        "Évaluation continue par quiz hebdomadaires générés automatiquement à partir du programme de cours.",
                        },
                        {
                                sector: 'Formations professionnelles',
                                scenario:
                                        "Certification en ligne de compétences techniques avec surveillance webcam et génération de certificats vérifiables.",
                        },
                ],
                benefits: [
                        "Réduction de 80% du temps de correction",
                        "Élimination de la fraude aux examens",
                        "Équité entre étudiants garantie",
                        "Économies de coûts d'impression et de logistique",
                        "Feedback pédagogique immédiat",
                ],
                targetAudience:
                        "Universités, grandes écoles, instituts de formation, centres de certification professionnelle",
        },
        {
                slug: 'opuc',
                name: 'OPUC',
                fullName: 'Outil de Pilotage Unifié de Chantier',
                tagline: 'La gestion de chantier BTP, sans angles morts',
                description:
                        'Outil de Pilotage Unifié de Chantier. Gestion BTP complète : pointage, budgets, stocks, documents.',
                longDescription:
                        "OPUC est la solution de gestion intégrée pour les entreprises du BTP qui veulent piloter leurs chantiers sans zone d'ombre. Pointage terrain en temps réel, suivi budgétaire granulaire, gestion des stocks multi-sites, centralisation documentaire : OPUC unifie toutes les dimensions d'un projet de construction dans une interface unique. Conçu avec des chefs de chantier africains, il s'adapte aux réalités du terrain (connectivité limitée, équipes nomades) avec un mode hors-ligne robuste.",
                externalUrl: 'https://opuc.ftci.fr',
                accentColor: 'green',
                iconPath:
                        'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                category: 'Gestion BTP',
                keywords: [
                        'gestion chantier BTP',
                        'pointage terrain',
                        'suivi budget construction',
                        'gestion stock BTP Afrique',
                        'pilotage chantier Côte d\'Ivoire',
                ],
                features: [
                        {
                                title: 'Pointage terrain mobile',
                                description:
                                        "Application mobile hors-ligne pour le pointage des ouvriers sur site avec géolocalisation et validation par chef de chantier.",
                        },
                        {
                                title: 'Suivi budgétaire temps réel',
                                description:
                                        "Comparaison permanent budget engagé / réalisé, alertes de dépassement, prévision de trésorerie par lot de travaux.",
                        },
                        {
                                title: 'Gestion des stocks multi-sites',
                                description:
                                        "Inventaire centralisé des matériaux et équipements sur plusieurs chantiers, transferts inter-sites, alertes de réapprovisionnement.",
                        },
                        {
                                title: 'Gestion documentaire',
                                description:
                                        "Centralisation des plans, contrats, bons de commande, procès-verbaux. Versionnement et traçabilité des documents.",
                        },
                        {
                                title: 'Mode hors-ligne complet',
                                description:
                                        "Fonctionnement 100% offline sur le terrain avec synchronisation automatique dès retour de la connectivité.",
                        },
                        {
                                title: 'Rapports & analytics',
                                description:
                                        "Tableaux de bord de productivité, rentabilité par chantier, exports comptables et bilans de fin de chantier.",
                        },
                ],
                useCases: [
                        {
                                sector: 'Entreprises BTP',
                                scenario:
                                        "Pilotage simultané de 15 chantiers avec vision consolidée des coûts, effectifs et avancement en temps réel.",
                        },
                        {
                                sector: "Maîtres d'ouvrage publics",
                                scenario:
                                        "Suivi transparent des projets d'infrastructure (routes, écoles, hôpitaux) avec traçabilité budgétaire complète.",
                        },
                        {
                                sector: "Bureaux d'études",
                                scenario:
                                        "Coordination des intervenants (architectes, ingénieurs, entrepreneurs) avec partage documentaire sécurisé.",
                        },
                ],
                benefits: [
                        "Réduction de 30% des dépassements budgétaires",
                        "Productivité ouvrière suivie en temps réel",
                        "Plus aucune perte de document de chantier",
                        "Fonctionnement garanti même sans réseau",
                        "Prise de décision basée sur des données fiables",
                ],
                targetAudience:
                        "Entreprises BTP, maîtres d'ouvrage, bureaux d'études, promoteurs immobiliers",
        },
        {
                slug: 'cats',
                name: 'CATS',
                fullName: 'Campus Attendance Tracking System',
                tagline: "La présence étudiante au doigt et à l'œil",
                description:
                        'Campus Attendance Tracking System. Pointage de présence par QR code pour campus universitaires.',
                longDescription:
                        "CATS digitalise la gestion de présence dans les campus universitaires en remplaçant les appels nominaux chronophages par un système de pointage QR code rapide et fiable. Chaque étudiant scanne son QR code personnel à l'entrée du cours, et CATS génère automatiquement les statistiques d'assiduité, les alertes d'absentéisme, et les rapports réglementaires. La solution s'intègre aux systèmes existants (ScolaGest, SECT) pour une vision 360° de la vie étudiante.",
                externalUrl: 'https://cats.ftci.fr',
                accentColor: 'periwinkle',
                iconPath: 'M12 4v16m8-8H4',
                category: 'Gestion de présence',
                keywords: [
                        'pointage présence université',
                        'QR code présence étudiant',
                        'assiduité campus Afrique',
                        'tracking présence cours',
                        'gestion absences université',
                ],
                features: [
                        {
                                title: 'Pointage QR code',
                                description:
                                        "Scan rapide en début de cours via smartphone ou borne dédiée, validation de présence en moins de 2 secondes par étudiant.",
                        },
                        {
                                title: 'Géolocalisation du pointage',
                                description:
                                        "Vérification que l'étudiant est bien dans la salle de cours au moment du scan, éliminant les pointages à distance frauduleux.",
                        },
                        {
                                title: "Alertes d'absentéisme",
                                description:
                                        "Notifications automatiques aux tuteurs et administration en cas d'absences répétées ou de chute d'assiduité.",
                        },
                        {
                                title: 'Statistiques & rapports',
                                description:
                                        "Tableaux de bord d'assiduité par étudiant, groupe, formation. Exports pour les conseils de discipline et commissions pédagogiques.",
                        },
                        {
                                title: 'Bornes physiques optionnelles',
                                description:
                                        "Compatibilité avec des bornes de scan dédiées installées à l'entrée des amphithéâtres pour les grands effectifs.",
                        },
                        {
                                title: 'Intégration ScolaGest & SECT',
                                description:
                                        "Synchronisation des présences avec la scolarité (ScolaGest) et les évaluations (SECT) pour corrélation présence/résultats.",
                        },
                ],
                useCases: [
                        {
                                sector: 'Universités',
                                scenario:
                                        "Pointage de 3 000 étudiants sur 80 cours quotidiens avec détection automatique des absences à risque.",
                        },
                        {
                                sector: 'Instituts de formation',
                                scenario:
                                        "Justification de l'assiduité pour les organismes financeurs de la formation professionnelle continue.",
                        },
                        {
                                sector: 'Écoles privées',
                                scenario:
                                        "Information aux parents en temps réel sur la présence de leurs enfants via portail dédié.",
                        },
                ],
                benefits: [
                        "Économie de 15 minutes de cours par session",
                        "Détection précoce du décrochage scolaire",
                        "Justification objective de l'assiduité",
                        "Plus de falsification possible des feuilles de présence",
                        "Corrélation présence/résultats scolaires",
                ],
                targetAudience:
                        'Universités, instituts de formation, écoles privées, centres de formation professionnelle',
        },
        {
                slug: 'scolagest',
                name: 'ScolaGest',
                fullName: 'Gestion Scolaire Multi-Établissements',
                tagline: 'La scolarité et la caisse, enfin unifiées',
                description:
                        'Gestion et caisse scolaire multi-établissements. Encaissement, échéanciers, Mobile Money, comptabilité.',
                longDescription:
                        "ScolaGest est l'ERP de gestion scolaire pensé pour les réseaux d'établissements africains. Il combine la gestion académique (inscriptions, emplois du temps, bulletins) et la gestion financière (encaissements, échéanciers, Mobile Money, comptabilité) dans une seule plateforme. ScolaGest supporte nativement les modes de paiement locaux (Orange Money, MTN Money, Moov Money) et les particularités réglementaires ivoiriennes et ouest-africaines.",
                externalUrl: 'https://scolagest.ftci.fr',
                accentColor: 'navy',
                iconPath:
                        'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                category: 'Gestion scolaire',
                keywords: [
                        'gestion scolaire Afrique',
                        'caisse scolaire Mobile Money',
                        'échéancier scolarité',
                        'ERP école multi-établissements',
                        'comptabilité scolaire Côte d\'Ivoire',
                ],
                features: [
                        {
                                title: 'Inscriptions & dossiers élèves',
                                description:
                                        "Centralisation des dossiers élèves avec historique complet, documents numériques, et gestion multi-établissements pour les groupes scolaires.",
                        },
                        {
                                title: 'Encaissements Mobile Money',
                                description:
                                        "Intégration native Orange Money, MTN Money, Moov Money, Wave. Réconciliation automatique des paiements avec les comptes élèves.",
                        },
                        {
                                title: 'Échéanciers de paiement',
                                description:
                                        "Définition de plans de paiement personnalisés par élève, suivi des retards, relances automatiques par SMS et email.",
                        },
                        {
                                title: 'Caisse & comptabilité',
                                description:
                                        "Tenue de caisse multi-utilisateurs, journaux comptables, exports vers les logiciels comptables standards, états financiers en temps réel.",
                        },
                        {
                                title: 'Emplois du temps & bulletins',
                                description:
                                        "Génération automatique des emplois du temps, calcul des moyennes, édition de bulletins personnalisables par établissement.",
                        },
                        {
                                title: 'Portails parents & enseignants',
                                description:
                                        "Espace parents pour suivi des paiements et résultats, espace enseignants pour saisie des notes et appréciations.",
                        },
                ],
                useCases: [
                        {
                                sector: 'Réseaux scolaires',
                                scenario:
                                        "Pilotage de 12 établissements (8 000 élèves) avec consolidation financière et pédagogique centralisée.",
                        },
                        {
                                sector: 'Écoles privées',
                                scenario:
                                        "Digitalisation complète des encaissements avec réduction de 90% des impayés grâce aux relances automatiques.",
                        },
                        {
                                sector: 'Universités privées',
                                scenario:
                                        "Gestion des frais de scolarité par semestre avec échéanciers flexibles et paiements Mobile Money intégrés.",
                        },
                ],
                benefits: [
                        "Réduction de 90% des impayés de scolarité",
                        "Plus de caisse opaque ou de détournement",
                        "Comptabilité tenue en temps réel",
                        "Parents informés en continu",
                        "Pilotage financier multi-sites unifié",
                ],
                targetAudience:
                        'Réseaux scolaires, écoles privées, universités privées, instituts de formation',
        },
];

/**
 * Tailwind class tokens for each product accent color, grouped by visual
 * role (text, background, border, shadow, gradient stops). Components select
 * a role by indexing with the product's `accentColor` so the palette stays
 * consistent across cards, buttons, and gradients.
 */
export const accentColorClasses: Record<
        Product['accentColor'],
        {
                text: string;
                bg: string;
                bgHover: string;
                border: string;
                shadow: string;
                from: string;
                to: string;
        }
> = {
        orange: {
                text: 'text-orange',
                bg: 'bg-orange',
                bgHover: 'hover:bg-orange-600',
                border: 'hover:border-orange',
                shadow: 'group-hover:shadow-orange/30',
                from: 'from-orange',
                to: 'to-orange-600',
        },
        green: {
                text: 'text-green',
                bg: 'bg-green',
                bgHover: 'hover:bg-green-600',
                border: 'hover:border-green',
                shadow: 'group-hover:shadow-green/30',
                from: 'from-green',
                to: 'to-green-600',
        },
        periwinkle: {
                text: 'text-periwinkle',
                bg: 'bg-periwinkle',
                bgHover: 'hover:bg-periwinkle-600',
                border: 'hover:border-periwinkle',
                shadow: 'group-hover:shadow-periwinkle/30',
                from: 'from-periwinkle',
                to: 'to-periwinkle-600',
        },
        navy: {
                text: 'text-navy',
                bg: 'bg-navy',
                bgHover: 'hover:bg-navy-700',
                border: 'hover:border-navy',
                shadow: 'group-hover:shadow-navy/30',
                from: 'from-navy',
                to: 'to-navy-700',
        },
};
