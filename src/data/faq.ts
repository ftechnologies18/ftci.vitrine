/**
 * Structured FAQ data for FTCI — used by the schema.org `FAQPage` JSON-LD
 * block (rich snippets in Google search results) and, if needed, by a future
 * FAQ UI section on the home page.
 *
 * Guidelines (Google FAQPage):
 *   - Only questions that have a visible answer on the page (or a clear
 *     dedicated landing page). Invisible Q/A is a spam signal.
 *   - Answers should be factual, not promotional. Avoid marketing copy.
 *   - Keep answers under ~300 chars for snippet eligibility.
 *
 * To add a question: append to {@linkcode faq}. Each entry flows both to the
 * UI (if rendered) and to the JSON-LD `mainEntity` array.
 */

export interface FaqItem {
	/** La question, formulée comme un utilisateur la poserait. */
	question: string;
	/** Réponse factuelle (visible sur le site, pas uniquement en JSON-LD). */
	answer: string;
}

/**
 * The seven most frequent questions prospects ask about FTCI. Each answer is
 * factual and grounded in content visible on the site (sections Produits,
 * Services, À Propos, Contact).
 */
export const faq: FaqItem[] = [
	{
		question: 'Qu’est-ce que FTCI et quels services proposez-vous ?',
		answer:
			"FTCI (Freelance Technologies Côte d'Ivoire) est une Entreprise de Services du Numérique (ESN) basée à Abidjan. Nous proposons 4 pôles de services : transformation digitale, développement web sur mesure, infrastructure IT, et assistance technique & formation. Nous éditons également 4 solutions SaaS : SECT, OPUC, CATS et ScolaGest.",
	},
	{
		question: 'Où êtes-vous situés et intervenez-vous en dehors de la Côte d’Ivoire ?',
		answer:
			"Notre siège est à Abidjan, en Côte d'Ivoire. Nous accompagnons les organisations ivoiriennes et ouest-africaines, et nos solutions SaaS sont pensées pour les réalités du marché africain (Mobile Money, connectivité limitée, mode hors-ligne).",
	},
	{
		question: 'Quelles sont vos solutions SaaS et à qui s’adressent-elles ?',
		answer:
			'Nous éditons 4 plateformes : SECT (évaluation universitaire par IA), OPUC (pilotage de chantier BTP), CATS (pointage de présence par QR code), et ScolaGest (gestion scolaire et caisse multi-établissements). Chacune cible un secteur spécifique mais partage une approche adaptée au contexte africain.',
	},
	{
		question: 'Comment se déroule un projet avec FTCI ?',
		answer:
			"Le projet démarre par un audit et un cadrage des besoins, suivi d'une roadmap stratégique. Nous développons ensuite la solution (sur mesure ou déploiement d'un de nos SaaS), avec conduite du changement et formation des équipes. Le support et la maintenance sont assurés en continu après la mise en production.",
	},
	{
		question: 'Proposez-vous des formations informatiques ?',
		answer:
			"Oui. Notre pôle Tech Assistance & Formation propose des formations pratiques en systèmes d'exploitation, bureautique, sécurité informatique, travail collaboratif, intelligence artificielle et développement. Les formations sont dispensées à Abidjan et adaptées aux besoins des entreprises comme des particuliers.",
	},
	{
		question: 'Vos solutions fonctionnent-elles avec une connectivité limitée ?',
		answer:
			'Oui. OPUC dispose d’un mode hors-ligne complet avec synchronisation automatique, et nos autres solutions sont optimisées pour les conditions de réseau africaines. ScolaGest supporte nativement les paiements Mobile Money (Orange Money, MTN Money, Moov Money, Wave).',
	},
	{
		question: 'Comment contacter FTCI pour démarrer un projet ?',
		answer:
			'Vous pouvez nous écrire à contact@ftci.fr, nous appeler au +225 05 66 18 40 40, ou utiliser le formulaire de contact sur notre site. Nous proposons également un échange WhatsApp pour les demandes rapides. Les équipes répondent sous 24 à 48 heures ouvrées.',
	},
];
