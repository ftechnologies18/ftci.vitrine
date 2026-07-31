# FTCI Vitrine

> Site vitrine institutionnel de **Freelance Technologies Côte d'Ivoire** (ESN basée à Abidjan).
> Astro 7 + Tailwind CSS 4 + Cloudflare Workers + Keystatic Cloud CMS.

[![Build & Deploy](https://github.com/ftechnologies18/ftci.vitrine/actions/workflows/deploy.yml/badge.svg)](https://github.com/ftechnologies18/ftci.vitrine/actions/workflows/deploy.yml)
[![Quality & Security](https://github.com/ftechnologies18/ftci.vitrine/actions/workflows/quality.yml/badge.svg)](https://github.com/ftechnologies18/ftci.vitrine/actions/workflows/quality.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 **Production** : [ftci.fr](https://ftci.fr) · **Preview** : [workers.dev](https://ftci-vitrine.freelancetechnologies-ci.workers.dev)

---

## 📋 Sommaire

- [Aperçu](#-aperçu)
- [Stack technique](#-stack-technique)
- [Démarrage rapide](#-démarrage-rapide)
- [Structure du projet](#-structure-du-projet)
- [Développement](#-développement)
- [Blog & CMS (Keystatic)](#-blog--cms-keystatic)
- [Déploiement](#-déploiement)
- [Sécurité](#-sécurité)
- [Configuration & secrets](#-configuration--secrets)
- [Maintenance & troubleshooting](#-maintenance--troubleshooting)
- [Documentation](#-documentation)

---

## 🎯 Aperçu

FTCI Vitrine est le site institutionnel de Freelance Technologies Côte d'Ivoire.
Il présente l'entreprise (ESN), ses 4 pôles de services, et ses 4 solutions SaaS
(SECT, OPUC, CATS, ScolaGest) pour le marché africain.

### Fonctionnalités principales

| Module                         | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| 🏠 **Vitrine**                 | Hero animé, sections Produits/Services/À Propos/Contact         |
| 📝 **Blog CMS**                | Keystatic Cloud, éditable par non-développeurs via `/keystatic` |
| 📧 **Formulaire contact**      | Email équipe (Resend) + Webhook Discord + toast UI              |
| 📞 **Double action téléphone** | Menu : Appel (tel:) ou WhatsApp (wa.me:)                        |
| 🔍 **SEO**                     | sitemap.xml, robots.txt, JSON-LD, Open Graph, flux RSS          |
| ⚖️ **Pages légales**           | Mentions légales, Confidentialité, CGU                          |

---

## 🛠️ Stack technique

| Élément             | Technologie                                          | Version |
| ------------------- | ---------------------------------------------------- | ------- |
| **Framework**       | [Astro](https://astro.build)                         | 7.x     |
| **Styling**         | [Tailwind CSS](https://tailwindcss.com)              | 4.x     |
| **Runtime**         | [Cloudflare Workers](https://workers.cloudflare.com) | —       |
| **CMS**             | [Keystatic Cloud](https://keystatic.com)             | 0.6.x   |
| **Storage**         | Cloudflare KV (messages contact + rate limit)        | —       |
| **Email**           | [Resend](https://resend.com)                         | —       |
| **Chat**            | Discord Webhook                                      | —       |
| **Language**        | TypeScript 5 (strict)                                | 5.x     |
| **Package manager** | pnpm                                                 | 9.15.0  |
| **Node**            | ≥ 22.12                                              | —       |
| **CI/CD**           | GitHub Actions → Cloudflare Workers                  | —       |

---

## 🚀 Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org) ≥ 22.12
- [pnpm](https://pnpm.io) 9.15+ (`corepack enable` si non installé)
- [Git](https://git-scm.com) ≥ 2.40

### Installation

```bash
git clone https://github.com/ftechnologies18/ftci.vitrine.git
cd ftci.vitrine
pnpm install
```

### Lancement en local

```bash
pnpm dev
# → http://localhost:4321
```

> 💡 En local, Keystatic fonctionne en mode `local` (fichiers lus/écrits sur disque).
> Pas besoin de secrets Cloudflare pour développer.

### Vérifications avant commit

```bash
pnpm lint          # ESLint
pnpm format:check  # Prettier (check sans write)
pnpm typecheck     # astro check (TypeScript)
pnpm run build     # build de production
pnpm audit         # vulnérabilités connues
```

> ℹ️ Le pre-commit hook (husky) exécute automatiquement `lint-staged` sur les fichiers modifiés.

---

## 📁 Structure du projet

```
ftci.vitrine/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml            # CI/CD : build + deploy Cloudflare Workers
│   │   └── quality.yml           # Lint + type-check + build + audit (sur PR)
│   ├── ISSUE_TEMPLATE/           # Templates issues (bug, feature, blog)
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS                # Propriétaires de code pour les PR
│   └── dependabot.yml            # Mises à jour auto des dépendances
│
├── .husky/
│   └── pre-commit                # Hook : lint-staged sur fichiers modifiés
│
├── patches/
│   └── @keystatic__astro@5.2.0.patch  # Patch compatibilité Astro 7
│
├── public/
│   ├── _headers                  # Headers de sécurité (CSP, HSTS, cache)
│   ├── _redirects                # Règles de redirection
│   ├── brand/                    # Logo + favicon FTCI
│   └── blog/images/              # Cover images des articles (SVG on-brand)
│
├── scripts/
│   └── gen-favicon.mjs           # Génération favicon depuis le logo
│
├── src/
│   ├── components/
│   │   ├── blog/                 # 7 composants blog (ArticleCard, CategoryBadge, etc.)
│   │   ├── Header.astro          # Navigation sticky + drawer mobile
│   │   ├── Footer.astro
│   │   ├── Hero.astro            # Mesh gradient animé + logo assemblage
│   │   ├── Products.astro        # 4 cartes produits tilt 3D
│   │   ├── Services.astro        # Timeline 4 services + SVG stroke
│   │   ├── About.astro           # Stats + compteurs animés
│   │   ├── Contact.astro         # Formulaire + toast + double action tél
│   │   └── SEO.astro             # Meta tags + JSON-LD global
│   ├── content/blog/             # Articles .mdoc (Keystatic Cloud)
│   ├── data/products.ts          # Données produits SaaS (source de vérité)
│   ├── layouts/
│   │   ├── Layout.astro          # Layout racine (SEO + scripts globaux)
│   │   └── BlogLayout.astro      # Layout blog (Header + Footer + slot SEO)
│   ├── lib/
│   │   ├── blog.ts               # Accès données blog (getCollection wrappers)
│   │   └── sanitize.ts           # safeJsonStringify (anti-XSS JSON-LD)
│   ├── pages/
│   │   ├── index.astro           # Page d'accueil
│   │   ├── blog/                 # Pages blog (index, [slug], categorie/[category])
│   │   ├── api/
│   │   │   ├── contact.ts        # POST formulaire contact (KV + Resend + Discord)
│   │   │   └── keystatic/        # Route API Keystatic (handler custom)
│   │   ├── legal/                # 3 pages légales
│   │   ├── rss.xml.ts            # Flux RSS 2.0
│   │   ├── sitemap.xml.ts        # Sitemap dynamique (blog inclus)
│   │   └── robots.txt.ts
│   └── styles/global.css         # Design system (tokens + utilities)
│
├── astro.config.mjs              # Config Astro (React, Markdoc, Keystatic, Cloudflare)
├── keystatic.config.ts           # Config Keystatic (cloud project, collections)
├── wrangler.jsonc                # Config Cloudflare Workers (KV bindings)
├── eslint.config.mjs             # ESLint 9 flat config
├── .prettierrc.json              # Prettier config
├── .editorconfig                 # Config éditeur uniforme
├── package.json
├── tsconfig.json
└── LICENSE                       # MIT
```

---

## 💻 Développement

### Scripts disponibles

| Commande            | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `pnpm dev`          | Serveur de dev (http://localhost:4321)                |
| `pnpm build`        | Build de production → `dist/`                         |
| `pnpm preview`      | Preview du build local                                |
| `pnpm lint`         | ESLint (erreurs + warnings)                           |
| `pnpm lint:fix`     | ESLint avec auto-fix                                  |
| `pnpm format`       | Prettier (format tous les fichiers)                   |
| `pnpm format:check` | Prettier (check sans write, pour CI)                  |
| `pnpm typecheck`    | astro check (TypeScript strict)                       |
| `pnpm audit`        | pnpm audit (vulnérabilités connues)                   |
| `pnpm deploy`       | Build + `wrangler deploy` (manuel)                    |
| `pnpm types`        | Génère `worker-configuration.d.ts` (types Cloudflare) |

### Convention de commits

Format : `<type>(<scope>): <description>`

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`

Exemples :

```
feat(blog): ajout d'un flux RSS pour les articles
fix(contact): corriger le rate limit distribué sur Cloudflare Workers
docs(readme): mettre à jour la section déploiement
```

> 📖 Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le guide complet.

### Travailler sur le blog

Les articles sont des fichiers `.mdoc` (Markdoc) dans `src/content/blog/`.
Le frontmatter suit le schéma défini dans `src/content.config.ts`.

Pour créer un article en local :

```bash
# Créer src/content/blog/mon-nouvel-article.mdoc avec le frontmatter suivant :
---
title: "Titre de l'article (5-120 chars)"
description: "Description SEO (50-160 chars)"
category: "cybersecurite"  # ou transformation-digitale, intelligence-artificielle, etc.
tags: ["tag1", "tag2"]
publishedAt: 2026-07-30
author: "Freelance Technologies CI"
coverImage: "/blog/images/mon-image.svg"
featured: false
draft: false
readingTime: 5
---
```

---

## 📝 Blog & CMS (Keystatic)

Le blog est éditable par des non-développeurs via **Keystatic Cloud**.

### Accès éditeur

1. Aller sur **[ftci.fr/keystatic](https://ftci.fr/keystatic)**
2. Cliquer **"Log in with Keystatic Cloud"**
3. S'authentifier via `cloud.keystatic.com` (compte GitHub avec write access au repo)
4. Éditer/créer des articles via l'UI
5. Sauvegarder → commit automatique sur `main` → déploiement auto (~2 min)

### 6 catégories éditoriales

| Slug                        | Label                     |
| --------------------------- | ------------------------- |
| `transformation-digitale`   | Transformation digitale   |
| `intelligence-artificielle` | Intelligence artificielle |
| `cloud-computing`           | Cloud & infrastructures   |
| `cybersecurite`             | Cybersécurité             |
| `tech-innovation`           | Tech & Innovation         |
| `actualites-ftci`           | Actualités FTCI           |

### Limites du plan gratuit Keystatic Cloud

- ♾️ Projets et teams illimités
- 👥 3 utilisateurs max par team
- 💾 Stockage images dans Git (illimité tant que repo < 1 GB)

> Voir [Keystatic Cloud pricing](https://keystatic.com/docs/cloud) pour les limites Pro.

---

## 🚢 Déploiement

### Architecture

```
GitHub (ftechnologies18/ftci.vitrine)
  ↓ git push sur main
GitHub Actions (.github/workflows/deploy.yml)
  ↓ pnpm install + pnpm build + wrangler deploy
Cloudflare Worker (ftci-vitrine)
  ├── Static assets (dist/client/) — servi par CDN
  ├── Worker code (dist/server/) — endpoints /api/*
  └── KV bindings (MESSAGE_STORE)
  ↓
https://ftci.fr (custom domain)
https://ftci-vitrine.freelancetechnologies-ci.workers.dev (preview)
```

### Déploiement automatique

Chaque `git push` sur `main` déclenche :

1. GitHub Actions : checkout → pnpm install → `pnpm run build` → `wrangler deploy`
2. Le Worker est mis à jour immédiatement (~30s)
3. Les static assets sont propagés par le CDN Cloudflare (~1-2 min)

### Déploiement manuel (dépannage)

```bash
pnpm run build
CLOUDFLARE_API_TOKEN="xxx" CLOUDFLARE_ACCOUNT_ID="xxx" pnpm exec wrangler deploy
```

### Secrets GitHub Actions requis

Dans **Settings → Secrets and variables → Actions** :

| Secret                  | Usage                                     |
| ----------------------- | ----------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Token API Cloudflare (déployer le Worker) |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID Cloudflare                     |

---

## 🔒 Sécurité

### Headers de sécurité (Cloudflare Workers)

Configurés dans [`public/_headers`](public/_headers) :

- `Content-Security-Policy` : restrictive (self + Keystatic Cloud)
- `Strict-Transport-Security` : HSTS 2 ans + preload + subdomains
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (déprécié, désactivé per OWASP)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` : camera/microphone/geolocation désactivés

### Mesures applicatives

- **XSS** : `safeJsonStringify()` pour JSON-LD, échappement HTML Astro
- **CSRF** : vérification Origin/Referer sur `/api/contact`
- **Rate limit** : 3 req/min/IP (KV distribué, fiable entre isolates)
- **Honeypot** : champ `website` caché (anti-bot)
- **Cookies** : HttpOnly + Secure (prod) + SameSite=Lax forcés
- **PII** : logs pseudonymisés (id message au lieu d'email)
- **Input validation** : Zod sur Content Collections, regex stricte sur email

### Signaler une vulnérabilité

voir [`SECURITY.md`](SECURITY.md).

---

## 🔧 Configuration & secrets

### Secrets Cloudflare Workers

Bindés via `wrangler secret put` (chiffrés côté Cloudflare) :

| Secret                | Usage                                     |
| --------------------- | ----------------------------------------- |
| `RESEND_API_KEY`      | Envoi emails (formulaire contact)         |
| `DISCORD_WEBHOOK_URL` | Notification Discord (formulaire contact) |
| `KEYSTATIC_SECRET`    | Signature cookies session Keystatic Cloud |

### KV Namespaces

| Binding         | Usage                                    |
| --------------- | ---------------------------------------- |
| `MESSAGE_STORE` | Messages formulaire contact + rate limit |
| `SESSION`       | Sessions (auto-créé par adapter Astro)   |

### Variables d'environnement

| Variable       | Valeur | Usage                          |
| -------------- | ------ | ------------------------------ |
| `NODE_VERSION` | `22`   | Build runtime (Workers Builds) |

---

## 🛠️ Maintenance & troubleshooting

### Logs en temps réel

```bash
CLOUDFLARE_API_TOKEN="xxx" pnpm exec wrangler tail
```

### Lister les messages contact stockés en KV

```bash
CLOUDFLARE_API_TOKEN="xxx" pnpm exec wrangler kv key list \
  --namespace-id=a46dcd55e8ec4c04890ced3cbc1b3557 --remote
```

### Lister les secrets bindés

```bash
CLOUDFLARE_API_TOKEN="xxx" pnpm exec wrangler secret list
```

### Vérifier le statut du déploiement

```bash
CLOUDFLARE_API_TOKEN="xxx" pnpm exec wrangler deployments list
```

### Problèmes courants

| Symptôme                                           | Cause                                              | Solution                                                   |
| -------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| `Authorization failed` sur `/keystatic`            | Bot Fight Mode Cloudflare bloque le callback OAuth | Désactiver Bot Fight Mode sur la zone ftci.fr              |
| Build local OOM (`exit 137`)                       | Bundle Keystatic + React trop lourd                | Laisser Cloudflare Builds faire le build (plus de mémoire) |
| `0 article` dans Keystatic UI                      | Articles en `.md` au lieu de `.mdoc`               | Renommer en `.mdoc` (Markdoc)                              |
| `Cannot find module 'cloudflare:workers'` au build | Adapter Cloudflare non activé en dev               | Normal en dev — le code fallback vers `import.meta.env`    |

---

## 📚 Documentation

| Fichier                            | Description                                                |
| ---------------------------------- | ---------------------------------------------------------- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guide de contribution (workflow, conventions, standards)   |
| [SECURITY.md](SECURITY.md)         | Politique de sécurité + comment reporter une vulnérabilité |
| [CHANGELOG.md](CHANGELOG.md)       | Historique des versions                                    |
| [AGENTS.md](AGENTS.md)             | Instructions pour les agents IA (Astro, conventions)       |
| [LICENSE](LICENSE)                 | Licence MIT                                                |

---

## 📞 Contact

**FTCI — Freelance Technologies Côte d'Ivoire**

- 📧 Email : [contact@ftci.fr](mailto:contact@ftci.fr)
- 📱 Téléphone : [+225 05 6618 4040](tel:+2250566184040)
- 📍 Localisation : Abidjan & Dabou, Côte d'Ivoire
- 🌐 Site : [ftci.fr](https://ftci.fr)

---

## 📄 Licence

© 2026 Freelance Technologies Côte d'Ivoire. Distribué sous licence [MIT](LICENSE).
