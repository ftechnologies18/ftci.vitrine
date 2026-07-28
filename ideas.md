# FTCI Site Vitrine - Design Direction

## Contexte
Freelance Technologies Côte d'Ivoire (FTCI) est une Entreprise de Services du Numérique (ESN) basée à Abidjan. Son cœur métier : 4 pôles de services (conseil, développement sur mesure, infrastructure IT, tech assistance & formation), complétés par l'édition de 4 solutions SaaS (SECT, OPUC, CATS, ScolaGest). Le site vitrine doit crédibiliser la structure, centraliser la présentation des services et produits, et véhiculer une image d'excellence technique.

---

## Trois approches de design

### 1. **Approche Minimaliste Géométrique**
Une esthétique épurée avec des formes géométriques nettes, inspirée par le design suisse. Palette restreinte (bleu marine, blanc, accents orange). Typographie sans-serif moderne. Animations subtiles et fonctionnelles.
- **Probabilité**: 0.08

### 2. **Approche Tech Futuriste Dynamique**
Ambiance cyberpunk/tech avec dégradés animés, grille de circuit imprimé, mesh gradients, effets de glow. Beaucoup de mouvement et de particules. Palette: bleu marine → pervenche → vert → orange. Très immersive.
- **Probabilité**: 0.07

### 3. **Approche Institutionnelle Élégante**
Design premium et crédible, inspiré par les sites d'agences de conseil haut de gamme. Typographie sophistiquée (Poppins + Inter), espaces blancs généreux, photographie de qualité, animations délicates. Palette FTCI respectée avec subtilité.
- **Probabilité**: 0.05

---

## Direction Choisie: **Approche Tech Futuriste Dynamique**

Cette approche correspond parfaitement au positionnement de FTCI comme entité digitale et technologique, tout en respectant l'identité visuelle existante (mosaïque en diamants, dégradés bleu-vert-orange).

### Design Movement
**Néomorphisme Tech + Glassmorphism** — fusion entre le design moderne épuré et les effets visuels futuristes, avec des surfaces translucides et des profondeurs subtiles.

### Core Principles
1. **Mouvement comme langage** — Les animations ne sont pas décoratives, elles racontent l'histoire de l'écosystème FTCI
2. **Hiérarchie par la lumière** — Les éléments importants brillent, les autres restent en arrière-plan
3. **Grille invisible** — Structure rigoureuse cachée sous des formes organiques
4. **Écosystème interconnecté** — Les 4 produits sont visuellement liés par des lignes et des flux animés

### Color Philosophy
- **Bleu Marine (#0F1E3D)** — Fondation, confiance, autorité institutionnelle
- **Bleu Pervenche (#6B7FC7)** — Transition, innovation, rêve technologique
- **Vert (#1E9E4F)** — Croissance, succès, énergie positive
- **Orange (#EE6C1A)** — Action, urgence, appel à l'action
- **Fond Clair (#F2F4F8)** — Légèreté, clarté, modernité
- **Gris Texte (#6B7280)** — Subtilité, lisibilité secondaire

**Intention émotionnelle**: Progression d'une base solide (bleu marine) vers l'innovation (pervenche) et la croissance (vert), avec des appels à l'action vibrants (orange).

### Layout Paradigm
**Asymétrique avec flux vertical dynamique**
- Hero avec mesh gradient animé et motif mosaïque en filigrane
- Sections alternées: texte à gauche/image à droite, puis inversé
- Grille de produits avec connexions visuelles animées
- Timeline verticale pour les services
- Footer avec motif de circuit imprimé discret

Pas de centrage systématique — utiliser des alignements asymétriques pour créer du mouvement visuel.

### Signature Elements
1. **Motif Mosaïque en Diamants** — Utilisé comme filigrane, séparateur de section, favicon, élément de hover
2. **Lignes de Connexion Animées** — Reliant les 4 produits, visualisant l'écosystème FTCI
3. **Mesh Gradient Animé** — Fond dynamique bleu marine → pervenche, mouvement lent façon "aurore numérique"

### Interaction Philosophy
- **Hover Effects**: Cartes produits avec tilt 3D léger + halo lumineux orange/vert
- **Scroll Storytelling**: Sections qui apparaissent progressivement (fade/slide via Intersection Observer)
- **Micro-interactions**: Compteurs animés, boutons magnétiques, tracés SVG animés
- **Feedback immédiat**: Chaque clic/hover doit produire une réaction visible

### Animation Guidelines
- **Durée**: 300-600ms pour les animations principales, 100-200ms pour les micro-interactions
- **Easing**: `cubic-bezier(0.23, 1, 0.32, 1)` pour les entrées/sorties (snappy ease-out)
- **GPU-only**: Animer uniquement `transform` et `opacity`, jamais `width/height/padding`
- **Mobile**: Réduction automatique des effets 3D complexes et des trails
- **Respect prefers-reduced-motion**: Toutes les animations doivent être désactivables

### Typography System
**Titres**: Poppins Bold / ExtraBold
- H1: 48px (desktop), 32px (mobile)
- H2: 36px (desktop), 24px (mobile)
- H3: 28px (desktop), 20px (mobile)

**Corps**: Inter Regular / Medium
- Body: 16px / 1.6 line-height
- Small: 14px / 1.5 line-height

**Accent "Technologies"**: Orange (#EE6C1A) en reprise du logo

### Brand Essence
**Positioning**: FTCI est le partenaire technologique qui transforme les institutions africaines en organisations digitales agiles et performantes.

**Personality**: Innovant, Fiable, Ambitieux

**Brand Voice**:
- Headlines: Actifs, inspirants, orientés résultats
- CTAs: Directs, urgents, motivants
- Microcopy: Clair, technique mais accessible

**Exemples**:
- ❌ "Bienvenue sur notre site" → ✅ "Transformez votre institution avec la technologie"
- ❌ "Cliquez ici" → ✅ "Découvrir SECT maintenant"

### Wordmark & Logo
**Logo**: Mosaïque en diamants formant un ruban/cœur, dégradé bleu marine → pervenche → vert → orange
- Version claire: sur fond foncé (header sticky)
- Version couleur: sur fond clair (hero, footer)

**Favicon**: Motif mosaïque en diamants, carré 32x32px

**Wordmark**: "Freelance Technologies Côte d'Ivoire" en Poppins Bold, avec "Technologies" en orange

### Signature Brand Color
**Orange (#EE6C1A)** — L'orange est la couleur d'action, d'urgence et d'optimisme. Elle contraste fortement avec le bleu marine et crée des points focaux visuels puissants. C'est la couleur des CTAs principaux et des moments clés du site.

---

## Style Decisions (à appliquer)

### Typographie
- Google Fonts: Poppins (700, 800) + Inter (400, 500, 600)
- Hiérarchie stricte: H1 > H2 > H3 > Body > Small
- Espacement: 1.6x line-height pour le corps, 1.2x pour les titres

### Espacement
- Système de grille: 4px base
- Sections: 80px (desktop), 60px (tablet), 40px (mobile)
- Padding interne: 24px (desktop), 16px (mobile)

### Ombres & Profondeur
- Légère: `0 1px 3px rgba(0,0,0,0.1)`
- Moyenne: `0 4px 12px rgba(0,0,0,0.15)`
- Forte: `0 12px 24px rgba(0,0,0,0.2)`
- Glow orange: `0 0 20px rgba(238, 108, 26, 0.3)`

### Coins Arrondis
- Petits éléments: 8px
- Cartes: 12px
- Sections: 16px
- Boutons: 8px

### Transitions
- Défaut: `transition-all duration-300 ease-out`
- Rapide: `duration-150`
- Lent: `duration-500`
