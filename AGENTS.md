# AGENTS.md — Instructions pour les agents IA et développeurs

Ce fichier donne le contexte projet aux agents IA (Claude, Cursor, Copilot, etc.)
et aux nouveaux développeurs pour travailler efficacement sur le codebase.

## 📋 Contexte projet

**FTCI Vitrine** est le site institutionnel de Freelance Technologies Côte d'Ivoire
(ESN basée à Abidjan). Stack : Astro 7 + Tailwind CSS 4 + Cloudflare Workers +
Keystatic Cloud CMS. Production sur https://ftci.fr.

## 🚀 Commandes essentielles

```bash
pnpm dev          # Serveur dev (http://localhost:4321)
pnpm build        # Build production
pnpm lint         # ESLint
pnpm typecheck    # astro check
pnpm format       # Prettier
```

## 🏗️ Architecture

- **Static-first** : Astro prérend toutes les pages au build. Seules les routes
  `/api/*` sont server-side (`export const prerender = false`).
- **Adapter Cloudflare** : activé en production uniquement (`NODE_ENV=production`).
  En dev, pas d'adapter (évite les crashes workerd).
- **Keystatic Cloud** : l'auth passe par `cloud.keystatic.com`, pas par notre
  handler API. Le handler `/api/keystatic/[...params]` est un contournement
  custom pour un bug de compatibilité Astro 7 + @astrojs/cloudflare.
- **Content Collections** : articles en `.mdoc` (Markdoc), pas `.md`.

## ⚠️ Pièges connus

### 1. `locals.runtime.ctx` removed en Astro v6

Ne JAMAIS accéder à `locals.runtime.ctx` (getter qui throw). Utiliser
`locals.cfContext` (nouvelle API @astrojs/cloudflare v4+).

### 2. `cloudflare:workers` au runtime, pas au build

`import { env } from 'cloudflare:workers'` ne fonctionne qu'au runtime Workers.
Au build (Vite), ça casse. Utiliser un dynamic import dans une fonction :

```ts
async function getCfEnv() {
	try {
		const mod = await import('cloudflare:workers');
		return mod.env;
	} catch {
		return undefined; // dev mode
	}
}
```

### 3. `waitUntil` binding `this`

Ne JAMAIS extraire `waitUntil` comme fonction nue :

```ts
// ❌ MAUVAIS : "Illegal invocation: function called with incorrect `this`"
const w = ctx.waitUntil;
w(promise);

// ✅ BON : appeler comme méthode
ctx.waitUntil(promise);
```

### 4. Build local OOM

Le bundle Keystatic + React est lourd. Le build local peut OOM (`exit 137`).
Cloudflare Workers Builds a plus de mémoire et build OK. Ne pas paniquer si
`pnpm run build` échoue localement — pousser et laisser CI faire.

### 5. Patch `@keystatic/astro`

Le patch `patches/@keystatic__astro@5.2.0.patch` est nécessaire pour la
compatibilité Astro 7. Il est appliqué automatiquement via
`pnpm.patchedDependencies` dans `package.json`. Ne pas le supprimer.

### 6. Override `minimatch@^10`

L'override `pnpm.overrides.minimatch = "^10.0.0"` patche la CVE
`brace-expansion` (DoS). Ne pas le supprimer (la v9 de minimatch dépend
de brace-expansion@2.x vulnérable).

## 🎨 Conventions de code

- **Indentation** : tabs (voir `.editorconfig`)
- **Quotes** : single quotes
- **Trailing comma** : all
- **Line width** : 100 chars
- **Commits** : Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Auteur commit** : `ftechnologies18 <freelancetechnologies.ci@gmail.com>`

## 📚 Documentation Astro

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## 🔄 Workflow de contribution

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le guide complet.
