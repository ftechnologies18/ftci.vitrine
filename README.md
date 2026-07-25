# FTCI - Freelance Technologies Côte d'Ivoire

## Site Vitrine Institutionnel

Site vitrine moderne et performant pour **Freelance Technologies Côte d'Ivoire**, un cabinet de conseil en transformation digitale et éditeur de solutions SaaS pour le marché africain.

---

## 🎯 Objectifs du Projet

- **Crédibiliser** la structure FTCI auprès des clients et prospects
- **Centraliser** la présentation des 4 produits SaaS (SECT, OPUC, CATS, ScolaGest)
- **Promouvoir** les services de conseil en transformation digitale
- **Véhiculer** une image d'excellence technique avec un design "tech" marquant

---

## 🛠️ Stack Technique

- **Framework**: Astro 7.1.3 (génération statique)
- **Styling**: Tailwind CSS 4.3.3 (configuration CSS-first)
- **Hébergement**: Cloudflare Pages
- **DNS**: Cloudflare
- **Domaine**: ftci.fr (avec sous-domaines produits)

---

## 🎨 Design & Identité Visuelle

### Palette de Couleurs FTCI

- **Bleu Marine** (#0F1E3D): Header, footer, texte fort
- **Bleu Pervenche** (#6B7FC7): Accents secondaires, dégradés
- **Vert** (#1E9E4F): CTA secondaires, badges
- **Orange** (#EE6C1A): CTA principal, éléments d'accroche
- **Fond Clair** (#F2F4F8): Fond de page
- **Gris Texte** (#6B7280): Texte secondaire

### Typographie

- **Titres**: Poppins Bold/ExtraBold
- **Corps**: Inter Regular/Medium
- **Accent**: Orange sur "Technologies"

---

## 📱 Sections du Site

1. **Header** - Navigation sticky avec logo
2. **Hero** - Titre principal avec animations
3. **Nos Solutions** - 4 produits SaaS avec cartes interactives
4. **Nos Services** - Timeline animée des services
5. **À Propos** - Présentation et statistiques
6. **Contact** - Formulaire et informations
7. **Footer** - Liens et informations légales

---

## ✨ Animations & Interactions

- Fade In: Sections au scroll
- Slide Up: Éléments avec mouvement
- Scale In: Redimensionnement
- Hover Effects: Cartes avec tilt 3D
- Compteurs Animés: Statistiques
- Respect de `prefers-reduced-motion`

---

## 🚀 Développement

### Installation

```bash
pnpm install
pnpm run dev
# http://localhost:4321/
```

### Build de Production

```bash
pnpm run build
pnpm run preview
```

---

## 🌐 Déploiement

### Cloudflare Pages

1. Connecter le repository Git
2. Build command: `pnpm run build`
3. Output directory: `dist`
4. Configurer le domaine `ftci.fr`

### Configuration DNS

- `ftci.fr` → Cloudflare Pages
- `sect.ftci.fr` → Vercel (CNAME)
- `opuc.ftci.fr` → Vercel (CNAME)
- `cats.ftci.fr` → Vercel (CNAME)
- `scolagest.ftci.fr` → Vercel (CNAME)

---

## 📊 Performance

### Core Web Vitals

- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

### Optimisations

- ✅ Génération statique (Astro)
- ✅ CSS optimisé (Tailwind CSS 4)
- ✅ Images optimisées
- ✅ Animations GPU-only
- ✅ Code splitting automatique

---

## ♿ Accessibilité

- ✅ Contrastes AA (WCAG 2.1)
- ✅ Navigation clavier
- ✅ Structure HTML sémantique
- ✅ Respect de `prefers-reduced-motion`

---

## 📱 Responsive Design

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 📞 Contact

**FTCI - Freelance Technologies Côte d'Ivoire**

- 📧 Email: contact@ftci.fr
- 📱 Téléphone: +225 01 23 45 67
- 📍 Localisation: Abidjan & Dabou, Côte d'Ivoire

---

© 2026 Freelance Technologies Côte d'Ivoire. Tous droits réservés.
