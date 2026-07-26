# FTCI — Freelance Technologies Côte d'Ivoire

Site vitrine institutionnel pour **Freelance Technologies Côte d'Ivoire**, cabinet de conseil en transformation digitale et éditeur de solutions SaaS pour le marché africain.

**Production** : [https://ftci.fr](https://ftci.fr) · **Preview** : [ftci-vitrine.freelancetechnologies-ci.workers.dev](https://ftci-vitrine.freelancetechnologies-ci.workers.dev)

---

## 📋 Table des matières

- [Stack technique](#-stack-technique)
- [Structure du projet](#-structure-du-projet)
- [Identité visuelle](#-identité-visuelle)
- [Animations & Skills](#-animations--skills)
- [Installation & développement](#-installation--développement)
- [Déploiement](#-déploiement)
- [Domaine & DNS](#-domaine--dns)
- [Performance & SEO](#-performance--seo)
- [Documentation](#-documentation)

---

## 🛠️ Stack technique

| Élément | Technologie | Version |
|---------|-------------|---------|
| **Framework** | Astro | 7.1.3 |
| **Styling** | Tailwind CSS | 4.3.3 |
| **Adapter** | @astrojs/cloudflare | 14.1.4 |
| **Runtime** | Cloudflare Workers | — |
| **Storage** | Cloudflare KV (messages contact) | — |
| **Language** | TypeScript | 5 (strict) |
| **Fonts** | Poppins (titres) + Inter (corps) | Google Fonts |
| **Hébergement** | Cloudflare Workers + Static Assets | — |
| **CI/CD** | GitHub → Cloudflare Workers Builds | auto-deploy |
| **DNS** | Cloudflare (transféré depuis AMEN) | — |
| **Domaine** | ftci.fr + sous-domaines produits | — |

---

## 📁 Structure du projet

```
ftci.vitrine/
├── public/
│   ├── brand/                    # Logo FTCI + image officielle
│   │   ├── logo-ftci.png
│   │   └── ftci-a.jpg
│   ├── favicon.svg
│   ├── _headers                  # Headers de sécurité (CSP, HSTS, cache)
│   └── _redirects                # Règles de redirection
├── skills/                       # 16 skills installés (9 design + 7 Astro)
│   ├── README.md                 # Synthèse des principes applicables
│   ├── skill-vignelli-canon-design-system.json
│   ├── skill-muller-brockmann-grid-systems.json
│   ├── skill-brand-book-generator.json
│   ├── skill-nyt-data-viz.json
│   ├── skill-small-biz-website-builder.json
│   ├── emilkowalski/             # 4 skills Emil Kowalski (markdown)
│   │   ├── animation-vocabulary/SKILL.md
│   │   ├── apple-design/SKILL.md
│   │   ├── emil-design-eng/SKILL.md
│   │   └── review-animations/{SKILL.md,STANDARDS.md}
│   └── astro/                    # 7 skills officiels Astro (markdown)
│       ├── astro-developer/      # Architecture, debugging, testing
│       ├── astro-pr-writer/      # Écriture de PR
│       ├── triage/               # Triage de bugs
│       ├── changeset/            # Versioning
│       ├── merge/                # Gestion des merges
│       ├── analyze-github-action-logs/
│       └── writing-comments/     # Standards de commentaires
├── src/
│   ├── components/
│   │   ├── Header.astro          # Sticky glassmorphism + drawer mobile
│   │   ├── Hero.astro            # Mesh aurore + logo assemblage + CTA
│   │   ├── Products.astro        # 4 cartes tilt 3D + connexion animée
│   │   ├── Services.astro        # Timeline SVG stroke animation
│   │   ├── About.astro           # Stats NYT + compteurs tabular-nums
│   │   ├── Contact.astro         # Formulaire + honeypot + API
│   │   ├── Footer.astro          # Mosaïque filigrane + 4 colonnes
│   │   ├── SEO.astro             # Meta tags + JSON-LD schema.org
│   │   ├── ProductLayout.astro   # Layout réutilisable pages produits
│   │   └── LegalLayout.astro     # Layout réutilisable pages légales
│   ├── data/
│   │   └── products.ts           # Données centralisées 4 produits SaaS
│   ├── layouts/
│   │   └── Layout.astro          # Layout racine (SEO + scripts globaux)
│   ├── pages/
│   │   ├── index.astro           # Page d'accueil
│   │   ├── solutions/            # 4 pages produits dédiées
│   │   │   ├── sect.astro
│   │   │   ├── opuc.astro
│   │   │   ├── cats.astro
│   │   │   └── scolagest.astro
│   │   ├── legal/                # 3 pages légales
│   │   │   ├── mentions-legales.astro
│   │   │   ├── confidentialite.astro
│   │   │   └── cgu.astro
│   │   ├── api/
│   │   │   └── contact.ts        # Endpoint POST (validation + KV storage)
│   │   ├── robots.txt.ts         # robots.txt dynamique
│   │   └── sitemap.xml.ts        # sitemap.xml dynamique (8 URLs)
│   └── styles/
│       └── global.css            # Design system (tokens + utilities)
├── astro.config.mjs              # Adapter Cloudflare configuré
├── wrangler.jsonc                # KV bindings (MESSAGE_STORE)
├── DEPLOYMENT.md                 # Guide déploiement Cloudflare
└── MIGRATION-DNS.md              # Guide migration DNS AMEN → Cloudflare
```

---

## 🎨 Identité visuelle

### Logo
- **Mosaïque en diamants** formant un ruban/cœur, dégradé bleu marine → pervenche → vert → orange
- Fichier : `/public/brand/logo-ftci.png`
- Wordmark : "FTCI" (Poppins ExtraBold) + "Technologies" (orange #EE6C1A)
- Motif mosaïque utilisé en filigrane (Hero, Footer, séparateurs)

### Palette de couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| **Navy** | `#0F1E3D` | Header, footer, texte fort, fond Hero |
| **Pervenche** | `#6B7FC7` | Accents secondaires, dégradés |
| **Vert** | `#1E9E4F` | CTA secondaires, badges, accents produits |
| **Orange** | `#EE6C1A` | CTA principal, accroche, "Technologies" |
| **Fond clair** | `#F2F4F8` | Fond de page |
| **Gris texte** | `#6B7280` | Texte secondaire, légendes |

### Typographie
- **Titres** : Poppins Bold/ExtraBold (cohérent avec la géométrie arrondie du wordmark)
- **Corps** : Inter Regular/Medium (lisibilité optimale)
- **Tracking size-specific** : négatif sur gros titres (-0.025em), ~0 sur body

---

## ✨ Animations & Skills

Le site applique **strictement** le cahier des charges (section 6) et les **16 skills** installés (9 design + 7 Astro).

### Animations (cahier des charges section 6)

| Section | Animation | Implémentation |
|---------|-----------|----------------|
| **6.1 Hero** | Mesh gradient "aurore numérique" | 4 radial-gradients sur fond navy, animation 24s |
| **6.1 Hero** | Assemblage logo au chargement | `animate-assemble` (scale 0.93 + blur → 1) |
| **6.2 Produits** | Tilt 3D au survol ±2.2° | `perspective: 1600px`, `preserve-3d`, `translateZ(40px)` |
| **6.2 Produits** | Halo lumineux orange/vert | `.halo-glow` avec `--halo-color` par produit |
| **6.2 About** | Compteurs animés au scroll | rAF ease-out 1.8s, `tabular-nums` (anti-jitter) |
| **6.2 CTA** | Boutons magnétiques | `data-magnetic` pointermove, transition 200ms |
| **6.3 Scroll** | Apparition progressive | IntersectionObserver sur `.observe` |
| **6.3 Services** | Icônes SVG stroke animation | `.stroke-draw` (dasharray 200 → 0) |
| **6.3 Fond** | Parallax léger | `data-parallax`, rAF throttled, passive |
| **6.4 Produits** | Lignes de connexion animées | `.connection-line` (dashFlow 20s) + nœuds pulsants |
| **6.4 Fond** | Motif circuit imprimé | SVG pattern, opacity 8% |
| **6.4 Desktop** | Curseur trail | Spring follow, grow on interactive |
| **6.5 A11y** | prefers-reduced-motion | Toutes animations désactivées/gentillement dégradées |
| **6.5 Mobile** | Dégradation gracieuse | Tilt désactivé, mesh ralenti, curseur absent |

### 9 Skills design appliqués

| Skill | Application |
|-------|-------------|
| **Vignelli Canon** | 2 fonts max, H1 statique, hiérarchie par taille/poids, tracking size-specific |
| **Müller-Brockmann** | Baseline 8px, `--space-N` modulaires, line-height px sur display |
| **Brand Book Generator** | Mesh navy + radiaux chauds (PAS bleu/violet), tilt ±2.2°, `translateZ(40px)` |
| **NYT Data Viz** | `tabular-nums`, UN accent héros (100K+), source lines italiques 11px |
| **Apple Design** | Transitions interruptibles, reduced-motion instant, glassmorphism |
| **Emil Design Engineering** | 4 easings custom, `scale(0.93)` (jamais 0), `:active scale(0.97)` 160ms, GPU-only |
| **Review Animations** | 10 standards non-négociables respectés |
| **Small Biz Website Builder** | Layout DNA varié par section, pas de clutter |
| **Animation Vocabulary** | Stagger, scroll-reveal, float, 3D tilt, tabular numbers |

### 7 Skills Astro (développement)

| Skill | Application |
|-------|-------------|
| **astro-developer** | Architecture, debugging, testing Astro — référence pour la structure du projet |
| **triage** | Workflow de triage de bugs (reproduce → diagnose → verify → fix) |
| **writing-comments** | Standards de commentaires JSDoc et inline pour la maintenabilité |
| **astro-pr-writer** | Structure de PR claire pour reviewers |
| **changeset** | Versioning et changelog |
| **merge** | Gestion des merges (résolution conflits, cleanup changesets, fix CI) |
| **analyze-github-action-logs** | Analyse des logs GitHub Actions |

### Easings custom (Emil Design)

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* UI interactions */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* iOS-like drawer */
--ease-spring: cubic-bezier(0.22, 0.9, 0.3, 1);  /* assemble */
```

---

## 🚀 Installation & développement

### Prérequis
- Node.js ≥ 22.12
- pnpm ≥ 9.15

### Installation

```bash
git clone https://github.com/ftechnologies18/ftci.vitrine.git
cd ftci.vitrine
pnpm install
```

### Développement local

```bash
pnpm run dev
# → http://localhost:4321/
```

### Build de production

```bash
pnpm run build
# → dist/ (client/ + server/)
```

### Preview du build

```bash
pnpm run preview
```

---

## 🌐 Déploiement

### Architecture

```
GitHub (ftechnologies18/ftci.vitrine)
  ↓ git push sur main
Cloudflare Workers Builds (auto-deploy)
  ↓ pnpm install && pnpm run build && wrangler deploy
Cloudflare Worker (ftci-vitrine)
  ├── Static assets (dist/client/) — servi par CDN
  ├── Worker code (dist/server/) — endpoint /api/contact
  └── KV bindings (MESSAGE_STORE, SESSION)
  ↓
https://ftci.fr (custom domain)
https://ftci-vitrine.freelancetechnologies-ci.workers.dev (preview)
```

### Auto-deploy

Chaque `git push` sur la branche `main` déclenche automatiquement :
1. Cloudflare clone le repo
2. `pnpm install --no-frozen-lockfile`
3. `pnpm run build` (astro build)
4. `wrangler deploy` (upload worker + assets)
5. Mise en production immédiate

### Déploiement manuel (si besoin)

```bash
pnpm run build
CLOUDFLARE_API_TOKEN="xxx" CLOUDFLARE_ACCOUNT_ID="xxx" npx wrangler deploy
```

### Variables d'environnement Cloudflare

| Variable | Valeur | Usage |
|----------|--------|-------|
| `NODE_VERSION` | `22` | Build runtime |

### KV Namespaces

| Binding | Usage |
|---------|-------|
| `MESSAGE_STORE` | Stockage des messages du formulaire de contact |
| `SESSION` | Sessions (auto-créé par l'adapter Astro) |

> Voir `DEPLOYMENT.md` pour le guide complet.

---

## 🌍 Domaine & DNS

### Configuration actuelle

| Domaine | Cible | Statut |
|---------|-------|--------|
| `ftci.fr` | Cloudflare Worker (custom domain) | ✅ Actif |
| `www.ftci.fr` | Cloudflare Worker (custom domain) | ✅ Actif |
| `sect.ftci.fr` | Vercel (sect-app) | ✅ Actif |
| `scolagest.ftci.fr` | Vercel (scolagest) | ✅ Actif |
| `opuc.ftci.fr` | Vercel (opuc) | ⏳ À configurer |
| `cats.ftci.fr` | Vercel (cats-attendance) | ⏳ À configurer |

### Nameservers

```
ara.ns.cloudflare.com
otto.ns.cloudflare.com
```

> DNS transféré d'AMEN vers Cloudflare. MX (email) et SPF préservés.
> Voir `MIGRATION-DNS.md` pour le guide complet.

---

## 📊 Performance & SEO

### Core Web Vitals

- **LCP** : optimisé (logo avec `fetchpriority="high"`, fonts préchargées)
- **CLS** : 0 (dimensions explicites sur images)
- **INP** : < 100ms (transitions GPU-only, rAF throttled)

### Optimisations

- ✅ Génération statique (10 pages pré-rendues)
- ✅ CSS optimisé (Tailwind CSS 4, 49 KB)
- ✅ Animations GPU-only (`transform` + `opacity`)
- ✅ `prefers-reduced-motion` respecté
- ✅ Code splitting automatique
- ✅ Images en formats modernes + lazy loading
- ✅ Headers de sécurité (CSP, HSTS, X-Frame-Options)
- ✅ Cache immutable pour assets hashés (`/_astro/*`)

### SEO

- ✅ Balises meta complètes (title, description, keywords par page)
- ✅ Open Graph + Twitter Card
- ✅ Canonical URLs
- ✅ Sitemap XML dynamique ([ftci.fr/sitemap.xml](https://ftci.fr/sitemap.xml))
- ✅ Robots.txt dynamique ([ftci.fr/robots.txt](https://ftci.fr/robots.txt))
- ✅ Données structurées JSON-LD :
  - `Organization` (toutes pages)
  - `WebSite` (toutes pages)
  - `SoftwareApplication` (pages produits)
  - `BreadcrumbList` (pages produits)

### Accessibilité

- ✅ Contrastes AA (WCAG 2.1)
- ✅ Navigation clavier complète
- ✅ Structure HTML sémantique (`<main>`, `<header>`, `<nav>`, `<footer>`)
- ✅ `aria-label`, `aria-expanded`, `role="dialog"` sur drawer mobile
- ✅ Alt text sur tous les éléments graphiques
- ✅ Respect de `prefers-reduced-motion`
- ✅ Focus visible (outline orange)

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| `DEPLOYMENT.md` | Guide complet de déploiement Cloudflare (6 étapes + dépannage) |
| `MIGRATION-DNS.md` | Guide migration DNS AMEN → Cloudflare (10 étapes) |
| `skills/README.md` | Synthèse des 9 skills de design installés |

---

## 📱 Sections du site

| Section | URL | Description |
|---------|-----|-------------|
| **Hero** | `/` | Titre + mesh aurore + logo + 2 CTA |
| **Nos Solutions** | `/#solutions` | 4 cartes produits tilt 3D + écosystème |
| **Nos Services** | `/#services` | Timeline 4 services + SVG stroke |
| **À Propos** | `/#about` | Stats NYT + compteurs + localisation |
| **Contact** | `/#contact` | Formulaire + coordonnées |
| **SECT** | `/solutions/sect` | Page produit dédiée |
| **OPUC** | `/solutions/opuc` | Page produit dédiée |
| **CATS** | `/solutions/cats` | Page produit dédiée |
| **ScolaGest** | `/solutions/scolagest` | Page produit dédiée |
| **Mentions légales** | `/legal/mentions-legales` | Page légale |
| **Confidentialité** | `/legal/confidentialite` | Politique RGPD |
| **CGU** | `/legal/cgu` | Conditions générales d'utilisation |

---

## 📞 Contact

**FTCI — Freelance Technologies Côte d'Ivoire**

- 📧 Email : [contact@ftci.fr](mailto:contact@ftci.fr)
- 📱 Téléphone : [+225 01 23 45 67](tel:+22501234567)
- 📍 Localisation : Abidjan & Dabou, Côte d'Ivoire

---

## 📄 Licence

© 2026 Freelance Technologies Côte d'Ivoire. Tous droits réservés.

---

## 🔄 Workflow Git

```bash
# Développement
git checkout main
git pull origin main

# Modifier le code
# ...

# Commit avec identité FTCI
git add -A
git commit -m "feat: ma nouvelle feature"
git push origin main

# → Auto-deploy Cloudflare se déclenche
# → Site mis à jour sur https://ftci.fr dans ~2 minutes
```

### Identité Git configurée

```
user.name:  ftechnologies18
user.email: freelancetechnologies.ci@gmail.com
```
