# Contribuer à FTCI Vitrine 🤝

Merci de prendre le temps de contribuer ! Ce guide décrit le workflow à suivre
pour proposer des modifications (bug fix, nouvelle fonctionnalité, contenu blog, etc.).

## 📋 Prérequis

| Outil       | Version | Vérifier         |
| ----------- | ------- | ---------------- |
| **Node.js** | ≥ 22.12 | `node --version` |
| **pnpm**    | 9.15.0  | `pnpm --version` |
| **Git**     | ≥ 2.40  | `git --version`  |

> 💡 Utilisez `corepack enable` si pnpm n'est pas installé (inclus avec Node ≥ 16).

## 🚀 Démarrage rapide

```bash
# 1. Fork & clone
git clone https://github.com/<votre-username>/ftci.vitrine.git
cd ftci.vitrine

# 2. Installer les dépendances
pnpm install

# 3. Lancer le serveur de dev (http://localhost:4321)
pnpm dev

# 4. Avant de commit, vérifier que tout passe
pnpm lint
pnpm typecheck
pnpm run build
```

## 🌿 Workflow de contribution

### 1. Créer une branche

```bash
git checkout main
git pull origin main
git checkout -b feat/ma-nouvelle-fonctionnalite
# ou : fix/description-du-bug, docs/maj-readme, etc.
```

**Convention de nommage des branches** : `<type>/<description-courte>`

- `feat/` : nouvelle fonctionnalité
- `fix/` : correction de bug
- `docs/` : documentation
- `refactor/` : refactoring
- `style/` : changements visuels
- `chore/` : maintenance (deps, config)

### 2. Développer

- Suivez les conventions de code (ESLint + Prettier sont activés)
- Le pre-commit hook (husky) formate et lint automatiquement les fichiers modifiés
- Écrivez des messages de commit clairs (voir [Conventionnal Commits](#-convention-de-commits))

### 3. Tester

Avant de pousser, vérifiez :

```bash
pnpm lint          # 0 erreur
pnpm typecheck     # 0 erreur (hors Hero.astro pré-existant)
pnpm run build     # build OK
```

Testez aussi visuellement :

- Desktop (1280px+)
- Tablette (768px)
- Mobile (375px)

### 4. Pousser & ouvrir une PR

```bash
git push origin feat/ma-nouvelle-fonctionnalite
```

Ouvrez une PR vers `main` en remplissant le [template](.github/PULL_REQUEST_TEMPLATE.md).

## 📝 Convention de commits

Format : `<type>(<scope>): <description>`

### Types autorisés

| Type       | Usage                                     |
| ---------- | ----------------------------------------- |
| `feat`     | Nouvelle fonctionnalité                   |
| `fix`      | Correction de bug                         |
| `docs`     | Documentation (README, COMMENTS, etc.)    |
| `style`    | Changements visuels (CSS, UI)             |
| `refactor` | Refactoring (pas de nouveau comportement) |
| `perf`     | Performance                               |
| `test`     | Tests                                     |
| `chore`    | Maintenance (deps, config, tooling)       |
| `ci`       | CI/CD                                     |
| `revert`   | Revert d'un commit précédent              |

### Scope (optionnel)

`contact`, `blog`, `keystatic`, `seo`, `header`, `footer`, `hero`, etc.

### Exemples

```
feat(blog): ajout d'un flux RSS pour les articles
fix(contact): corriger le rate limit distribué sur Cloudflare Workers
docs(readme): mettre à jour la section déploiement
style(hero): ajuster l'animation du mesh gradient
chore(deps): bump astro de 7.1.3 à 7.2.0
```

> 💡 Le footer du commit doit se terminer par :
>
> ```
> Auteur: ftechnologies18 <freelancetechnologies.ci@gmail.com>
> ```

## 🎨 Standards de code

### Style

- **Indentation** : tabs (configuré via `.editorconfig`)
- **Quotes** : single quotes `'`
- **Semicolons** : always
- **Trailing comma** : all (ES2017+)
- **Line width** : 100 caractères

### Astro / TypeScript

- Toujours typer les props des composants (`interface Props`)
- Préférer `import type` pour les imports de types
- `export const prerender = false` sur les routes API (server-side)
- Pas de `any` explicite — utiliser `unknown` + narrowing

### Accessibilité (a11y)

- `aria-label` sur les éléments interactifs sans texte visible
- `alt` descriptif sur les images (ou `alt=""` si décoratif)
- `focus-visible` avec outline visible (couleur orange FTCI)
- Contrastes AA (WCAG 2.1)
- Navigation clavier complète (Tab, Shift+Tab, Enter, Escape)

### Performance

- Animations GPU-only (`transform` + `opacity`, jamais `width`/`height`/`padding`)
- `prefers-reduced-motion` respecté
- Images en formats modernes (WebP, AVIF) avec `loading="lazy"` (sauf LCP)
- Pas de layout shift (dimensions explicites sur images)

## 📝 Contribuer au blog (contenu éditorial)

Le blog est géré via **Keystatic Cloud**. Pour créer/modifier un article :

1. Allez sur **https://ftci.fr/keystatic**
2. Connectez-vous avec GitHub (compte avec accès write au repo)
3. Éditez via l'UI Keystatic
4. Sauvegardez → commit automatique sur `main` → déploiement auto

**Pour une contribution via PR** (review requise) :

- Créez un fichier `.mdoc` dans `src/content/blog/`
- Respectez le frontmatter du schéma (`src/content.config.ts`)
- Voir `keystatic.config.ts` pour les 6 catégories disponibles

## 🐛 Signaler un bug

Ouvrez une issue avec le template **[🐛 Rapport de bug](.github/ISSUE_TEMPLATE/bug_report.yml)**.

## ✨ Proposer une fonctionnalité

Ouvrez une issue avec le template **[✨ Demande de fonctionnalité](.github/ISSUE_TEMPLATE/feature_request.yml)**.

## 🔒 Signaler une vulnérabilité de sécurité

**N'ouvrez PAS d'issue publique.** Voir [SECURITY.md](SECURITY.md).

## ❓ Questions ?

- 💬 Discussions GitHub (pour les questions générales)
- 📧 Email : freelancetechnologies.ci@gmail.com

---

Merci de contribuer à FTCI Vitrine ! 🎉
