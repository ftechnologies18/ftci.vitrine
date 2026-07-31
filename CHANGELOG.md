# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/spec/v2.0.0.html).

## [1.0.0] — 2026-07-31

### ✨ Added

- **Blog CMS complet** avec Keystatic Cloud (éditable par non-développeurs via `/keystatic`)
  - 6 catégories éditoriales : Transformation digitale, IA, Cloud, Cybersécurité, Tech & Innovation, Actualités FTCI
  - 4 articles seed rédigés
  - Flux RSS 2.0 (`/rss.xml`)
  - Pages catégories (`/blog/categorie/<slug>`)
  - Schema.org BlogPosting (rich snippets Google)
  - Sitemap dynamique (blog + catégories + articles)
- **Formulaire de contact** avec notifications multi-canal
  - Email équipe FTCI via Resend (reply-to visiteur)
  - Email confirmation visiteur (délai 48h annoncé)
  - Webhook Discord (notification temps réel)
  - Toast de confirmation visuel (glassmorphism, auto-dismiss, pause au survol)
  - Rate limit distribué KV (3 req/min/IP, fiable entre isolates)
  - CSRF protection (vérification Origin/Referer)
  - Honeypot anti-bot
- **Double action téléphone** (menu déroulant) : Appel + WhatsApp avec message pré-rempli
- **9 sujets** pour le formulaire de contact (Demande de devis, Consultation, Démo, Support, Partenariat, Formation, Infrastructure, Développement, Autre)
- **Header sticky** glassmorphism avec drawer mobile accessible
- **Sections Hero** (mesh gradient animé + logo assemblage), Produits (tilt 3D), Services (timeline SVG), À Propos (compteurs), Contact
- **Footer** mosaïque filigrane + 4 colonnes
- **3 pages légales** : Mentions légales, Confidentialité, CGU
- **SEO complet** : Open Graph, Twitter Card, canonical, sitemap.xml, robots.txt
- **Identité visuelle FTCI** : palette navy/pervenche/vert/orange, Poppins + Inter
- **Tooling DevOps** : ESLint 9 flat config, Prettier, husky pre-commit, lint-staged, dependabot
- **GitHub templates** : bug report, feature request, blog content, PR template, SECURITY.md, CONTRIBUTING.md
- **CI/CD** : GitHub Actions (build + deploy Cloudflare Workers), CODEOWNERS

### 🔒 Security

- **Audit de sécurité complet** (13 failles corrigées : 4 HIGH, 5 MEDIUM, 4 LOW)
- `safeJsonStringify()` pour prévenir XSS via JSON-LD (`</script>` injection)
- Stack trace masquée en production (anti information disclosure)
- Cookies : `HttpOnly`, `Secure` (prod), `SameSite: 'lax'` forcés
- PII pseudonymisées dans les logs (email visiteur → id message)
- `X-XSS-Protection: 0` (header déprécié désactivé, OWASP)
- User-Agent capped à 256 chars (anti DoS KV)
- Email regex stricte (TLD ≥ 2 chars)
- `cf-connecting-ip` prioritaire (anti IP spoofing)
- Headers de sécurité Cloudflare : CSP restrictive, HSTS preload, X-Frame-Options, etc.
- Override `minimatch@^10` pour patcher CVE `brace-expansion` (DoS)

### ♻️ Changed

- Architecture basculée sur **Astro 7** (App Router, Content Layer API)
- **Keystatic Cloud** (au lieu d'OAuth App GitHub custom) pour l'authentification
- **Cloudflare Workers** (au lieu de Pages) pour le runtime serverless
- Articles blog en `.mdoc` (Markdoc) au lieu de `.md` (compatibilité Keystatic)

### 🗑️ Removed

- `skills/` (30 fichiers, 572K — référentiels design initiaux, plus utiles en prod)
- `ideas.md` (notes de design initiales)
- `CLAUDE.md` (symlink redondant vers AGENTS.md)
- `MIGRATION-DNS.md` (migration DNS one-shot terminée)
- `DEPLOYMENT.md` (consolidé dans le README)
- `ProductLayout.astro` (328 lignes — obsolète, pages `/solutions/*` supprimées)
- `productMap`, `getProduct`, `productUrls` dans `products.ts` (code mort)
- `servicePillars` dans `About.astro` (jamais rendu)
- `nodeColors` dans `Products.astro` (jamais utilisé)
- Classes CSS `.btn-outline`, `.btn-outline-light` (jamais utilisées)
- 4 `console.log` de debug dans le handler Keystatic (info disclosure mineure)

### 🐛 Fixed

- Bug visuel `dispersion-glow` Hero (toujours periwinkle — branche conditionnelle morte)
- Bug `locals.runtime.ctx` removed en Astro v6 (utilise `locals.cfContext`)
- Bug `Illegal invocation` sur `waitUntil` (binding `this` perdu)
- Bug `fields.markdown` → `fields.markdoc` (Keystatic 0.6)
- Bug route API `/api/keystatic` 404 (création manuelle de la route)
- Bug cookies session OAuth "Authorization failed" (switch vers Keystatic Cloud)

## [0.0.1] — 2026-07-28

### ✨ Added

- Version initiale du site vitrine FTCI
- Sections : Hero, Produits, Services, À Propos, Contact
- Pages légales (Mentions légales, Confidentialité, CGU)
- Déploiement Cloudflare Workers via GitHub Actions

---

## Types de changements

- `Added` pour les nouvelles fonctionnalités
- `Changed` pour les changements de fonctionnalités existantes
- `Deprecated` pour les fonctionnalités bientôt supprimées
- `Removed` pour les fonctionnalités supprimées
- `Fixed` pour les corrections de bugs
- `Security` pour les vulnérabilités corrigées
