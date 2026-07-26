# Skills de Design & Développement — FTCI Vitrine

Ce dossier contient **16 skills** installés depuis trois repos, utilisés comme **référence de discipline design et développement Astro** pour le site FTCI.

## 📚 Skills installés

### Repo 1 : hyperagent-public-skills (5 skills JSON — Design)

Source : [alexmcdonnell-airtable/hyperagent-public-skills](https://github.com/alexmcdonnell-airtable/hyperagent-public-skills)

| Skill | Usage FTCI | Discipline |
|-------|------------|-----------|
| `skill-vignelli-canon-design-system.json` | Rigueur typo, intemporalité, hiérarchie | Discipline globale |
| `skill-muller-brockmann-grid-systems.json` | Grilles modulaires, alignement, composition | Structure |
| `skill-brand-book-generator.json` | Identité visuelle moderne, hero, bento | Expression visuelle |
| `skill-small-biz-website-builder.json` | Playbook de web design moderne | Bonnes pratiques |
| `skill-nyt-data-viz.json` | Couleurs, typo, annotation des data viz | Visualisation données |

### Repo 2 : emilkowalski_skills (4 skills markdown — Motion)

Source : [attentiondotnet/emilkowalski_skills](https://github.com/attentiondotnet/emilkowalski_skills/tree/main/skills)

| Skill | Usage FTCI | Discipline |
|-------|------------|-----------|
| `emilkowalski/animation-vocabulary/SKILL.md` | Glossaire reverse-lookup des termes d'animation | Vocabulaire |
| `emilkowalski/apple-design/SKILL.md` | Motion fluide, springs, gestures, matériaux translucides | Motion iOS-style |
| `emilkowalski/emil-design-eng/SKILL.md` | Philosophie UI polish, décisions d'animation, craft | Design engineering |
| `emilkowalski/review-animations/SKILL.md` + `STANDARDS.md` | Standards non-négociables pour reviewer les animations | Code review |

### Repo 3 : withastro/astro (7 skills markdown — Développement Astro)

Source : [withastro/astro/.agents/skills](https://github.com/withastro/astro/tree/main/.agents/skills)

| Skill | Description | Fichiers |
|-------|-------------|----------|
| `astro/astro-developer/` | Guide complet développement Astro : architecture, debugging, testing, contraintes | `SKILL.md`, `architecture.md`, `constraints.md`, `debugging.md`, `testing.md` |
| `astro/astro-pr-writer/` | Écriture de PR Astro avec titles et bodies reviewer-friendly | `SKILL.md` |
| `astro/triage/` | Triage de bugs : reproduire, diagnostiquer, vérifier, fixer | `SKILL.md`, `diagnose.md`, `fix.md`, `reproduce.md`, `verify.md` |
| `astro/changeset/` | Création de changesets pour versioning et changelog | `SKILL.md` |
| `astro/merge/` | Gestion des merges main→next : résolution conflits, cleanup changesets, fix CI | `SKILL.md`, `clean-changesets.md`, `fix-ci.md`, `resolve-conflicts.md` |
| `astro/analyze-github-action-logs/` | Analyse des logs GitHub Actions pour identifier patterns et erreurs | `SKILL.md` |
| `astro/writing-comments/` | Standards pour écrire des commentaires JSDoc et inline dans le code Astro | `SKILL.md` |

#### Skills Astro les plus pertinents pour FTCI

- **`astro-developer`** — Architecture, debugging et testing Astro. Référence pour comprendre la structure du projet, les contraintes de build, et les bonnes pratiques.
- **`triage`** — Workflow complet de triage de bugs (reproduce → diagnose → verify → fix). Utile pour déboguer les issues de production.
- **`writing-comments`** — Standards de commentaires pour contributeurs. Assure la maintenabilité du code.
- **`astro-pr-writer`** — Structure de PR claire pour reviewers. Améliore la qualité des contributions.

---

## 🎯 Application prioritaire #2 (tilt 3D + mesh gradient)

### Du Vignelli Canon
- **Discipline** : ne pas ajouter d'éléments décoratifs inutiles
- **Hiérarchie typo** stricte (max 2 familles, 3-4 tailles)
- **Intemporalité** : préférer les solutions simples et durables
- **Titre hero STATIQUE** — tilt/mesh uniquement sur l'arrière-plan

### Du Müller-Brockmann
- **Grille modulaire** : baseline 8px, tous espacements multiples de 8
- **Proportions** mathématiques (1:1.618, 1:√2)
- **Espace blanc** comme élément structurel
- **Line-height en px** sur display type (jamais unitless)

### Du Brand Book Generator
- **PAS de mesh bleu/violet** (aurora AI = anti-pattern)
- **Radial-gradients chauds** (orange + vert) sur fond navy
- **Tilt 3D ±2.2° max** — subtil et pro
- **Stagger assemble** avec `cubic-bezier(.22,.9,.3,1)`

### Du Small Biz Website Builder
- **Vary layout DNA** par produit (pas juste re-skin)
- **Éviter le clutter** (4 éléments max par carte)
- **Micro-interactions** avec scroll memory + Escape

### Du NYT Data Viz
- **tabular-nums** sur tous les chiffres (empêche count-up jitter)
- **UN seul accent héros** par vue, les autres en gris
- **Source line** italique 11px sous chaque stat

---

## 🎬 Skills Emil Kowalski — Application motion

### Animation Vocabulary (glossaire)
Termes précis pour décrire les effets :
- **Stagger** = cascade d'items avec délai entre chacun
- **Pop in** = apparition avec overshoot léger
- **Scroll reveal** = apparaît au scroll
- **3D tilt / Flip** = rotation 3D (rotateX/rotateY) pour la profondeur
- **Float** = dérive continue douce (élément "vivant")
- **Tabular numbers** = chiffres à largeur fixe (essentiel pour tickers/compteurs)
- **Spring** = animation physique (tension/masse/amortissement)
- **Rubber-banding** = résistance + snap-back aux bornes (iOS overscroll)

### Apple Design (motion fluide)
- **Response** : feedback sur pointer-DOWN, pas sur release
- **Direct manipulation** : tracking 1:1 pendant le geste
- **Interruptibilité** : TOUJOURS animer depuis la valeur de présentation courante
- **Springs > keyframes** pour les gestures (interruptibles par nature)
- **Damping ratio + Response** : les 2 params designer-friendly
  - Default UI : `damping 1.0`, `response 0.3-0.4`
  - Momentum/flick : `damping ~0.8`, `response 0.3-0.4`
- **Velocity handoff** : passer la vélocité du gesture au spring
- **Spatial consistency** : enter/exit sur le même chemin
- **Rubber-banding** aux bornes (pas de hard stop)
- **Materials** : `backdrop-filter: blur()` pour les barres/sheets translucides
- **Typography** : tracking size-specific (négatif sur gros, ~0 sur body)
- **Reduced motion** : cross-fade, pas slide/spring

### Emil Design Engineering (craft)
**Animation Decision Framework** (4 questions dans l'ordre) :
1. **Should this animate?** → fréquence (100+/day = JAMAIS ; tens/day = réduire ; occasional = standard ; rare = delight)
2. **Purpose?** → spatial consistency / state indication / feedback / explanation / preventing jarring
3. **Easing?** → enter/exit = ease-out ; move = ease-in-out ; hover = ease ; constant = linear
4. **Duration?** → button 100-160ms ; tooltip 125-200ms ; dropdown 150-250ms ; modal 200-500ms ; **UI < 300ms**

**Easing curves custom (obligatoire)** :
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

**Règles physiques** :
- **JAMAIS `scale(0)`** → commencer à `scale(0.95)` + `opacity: 0`
- **Popovers origin-aware** : `transform-origin` sur le trigger (pas center)
- **Modals** = exception, restent centrés
- **Boutons** : `scale(0.97)` sur `:active` avec `transition: transform 160ms ease-out`
- **Transitions > keyframes** pour UI dynamique (interruptible)
- **Blur 2px** pour masquer les crossfades imparfaites

**Performance** :
- Animer **uniquement `transform` et `opacity`** (GPU)
- **JAMAIS** `width/height/margin/padding/top/left` (layout thrashing)
- **CSS > JS** sous charge (CSS = off main thread)
- **WAAPI** pour contrôle JS + perf CSS

**Accessibility** :
- `@media (prefers-reduced-motion: reduce)` → garder opacity/color, drop transform
- `@media (hover: hover) and (pointer: fine)` → gate les hover (touch = false hover)

### Review Animations (standards non-négociables)
Les **10 standards** à respecter :
1. **Justified motion** — chaque animation répond "pourquoi?"
2. **Frequency-appropriate** — keyboard/100+day = no animation
3. **Responsive easing** — ease-out ou custom curve (jamais ease-in sur UI)
4. **Sub-300ms UI** — sauf justification
5. **Origin & physical correctness** — popovers depuis trigger, jamais scale(0)
6. **Interruptibility** — transitions/springs pour UI dynamique
7. **GPU-only properties** — transform + opacity uniquement
8. **Accessibility** — prefers-reduced-motion + hover gating
9. **Asymmetric enter/exit** — slow deliberation, fast response
10. **Cohesion** — motion matches component personality

**Escalation triggers** (flag on sight) :
- `transition: all`
- `scale(0)` ou pure-fade sans transform
- `ease-in` sur UI
- Animation sur keyboard shortcut
- UI duration > 300ms sans raison
- `transform-origin: center` sur popover
- Keyframes sur toasts/toggles
- Animating layout properties
- Missing `prefers-reduced-motion`
- Ungated `:hover`
- Symmetric enter/exit sur press-and-release
- Everything-at-once sans stagger

---

## 🔧 Comment utiliser ces skills

1. **Avant de coder** : relire les principes clés ci-dessus
2. **Pendant le code** : appliquer la discipline (baseline 8px, ease-out, < 300ms, etc.)
3. **Après le code** : reviewer avec les 10 standards non-négociables
4. **Pour détailler** : consulter les fichiers source dans `/skills/`

## 📖 Sources

- Repo 1 : https://github.com/alexmcdonnell-airtable/hyperagent-public-skills
- Repo 2 : https://github.com/attentiondotnet/emilkowalski_skills
- Cours Emil Kowalski : https://animations.dev/
