# Guide de Déploiement — FTCI sur Cloudflare Workers

Ce guide détaille le déploiement du site FTCI vitrine sur **Cloudflare Workers** (via l'adapter `@astrojs/cloudflare`) avec le domaine **ftci.fr**.

> ⚠️ **Note importante** : le projet est déployé sur **Cloudflare Workers** (runtime Workers + static assets), pas sur Cloudflare Pages. Le sous-domaine de preview est `ftci-vitrine.freelancetechnologies-ci.workers.dev`.

---

## 🚀 Pipeline CI/CD (GitHub Actions → Cloudflare Workers)

Le déploiement automatique est piloté par **GitHub Actions** (voir `.github/workflows/deploy.yml`).

### Fonctionnement

```
git push origin main
    ↓
GitHub Actions se déclenche
    ↓
1. Checkout du code
2. Setup Node 22 + pnpm 9.15.0
3. pnpm install --frozen-lockfile
4. pnpm run build        (astro build, NODE_ENV=production)
5. wrangler deploy       (via cloudflare/wrangler-action@v3)
    ↓
Worker ftci-vitrine mis à jour sur https://ftci.fr
```

### Prérequis : secrets GitHub Actions

Le workflow utilise deux secrets à configurer dans **GitHub → Settings → Secrets and variables → Actions → New repository secret** :

| Nom du secret | Valeur | Où la trouver |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Token API Cloudflare (scoped "Edit Cloudflare Workers") | dash.cloudflare.com → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | `319de93db5a99db76b4bf41f9d06b785` | dash.cloudflare.com → (sidebar) Account ID |

⚠️ **Sécurité** : ne JAMAIS committer ces valeurs dans le repo. Elles doivent vivre uniquement dans les secrets GitHub.

### Déclenchement

- **Automatique** : à chaque `git push` sur la branche `main`
- **Manuel** : onglet "Actions" → "Build & Deploy to Cloudflare Workers" → "Run workflow"

### Annulation des runs concurrents

Un nouveau push annule automatiquement le run précédent s'il est encore en cours (config `concurrency: cancel-in-progress: true`). Cela évite les déploiements concurrents et libère le runner plus tôt.

### Consulter les logs

1. GitHub → onglet **Actions**
2. Cliquer sur le run concerné
3. Étape "☁️ Déploiement sur Cloudflare Workers" → logs détaillés du `wrangler deploy`

### En cas d'échec

- **`pnpm install --frozen-lockfile` échoue** : le `pnpm-lock.yaml` n'est pas à jour. Le regénérer localement avec `pnpm install` puis committer.
- **`wrangler deploy` échoue avec "Authentication error"** : vérifier que `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` sont bien configurés et que le token a les permissions "Edit Cloudflare Workers".
- **`wrangler deploy` échoue avec "KV namespace not found"** : l'ID `a46dcd55e8ec4c04890ced3cbc1b3557` dans `wrangler.jsonc` ne correspond à aucun namespace du compte. Le recréer dans le dashboard Cloudflare.

---

## 🛠️ Déploiement manuel (fallback)

Si GitHub Actions est indisponible ou pour tester un build local :

```bash
# 1. Installer les dépendances
pnpm install

# 2. Build production
NODE_ENV=production pnpm run build

# 3. Déployer (nécessite CLOUDFLARE_API_TOKEN en env ou `wrangler login`)
CLOUDFLARE_API_TOKEN=xxxxx CLOUDFLARE_ACCOUNT_ID=319de93db5a99db76b4bf41f9d06b785 \
  pnpm run deploy
```

---

## 📋 Prérequis

- [x] Compte Cloudflare (gratuit)
- [x] Repo GitHub : `https://github.com/ftechnologies18/ftci.vitrine`
- [x] Domaine `ftci.fr` enregistré chez AMEN
- [x] Projet Astro + adapter Cloudflare configuré

---

## 🏗️ Architecture cible

```
ftci.fr (Cloudflare Pages)
├── /                    → Page d'accueil (statique)
├── /solutions/*         → 4 pages produits (statiques)
├── /legal/*             → 3 pages légales (statiques)
├── /robots.txt          → Endpoint (statique)
├── /sitemap.xml         → Endpoint (statique)
└── /api/contact         → Worker Cloudflare (dynamique, KV storage)

Sous-domaines produits (Vercel — pas concernés par ce déploiement) :
├── sect.ftci.fr       → SECT (sect-app.vercel.app)
├── opuc.ftci.fr       → OPUC (opuc.vercel.app)
├── cats.ftci.fr       → CATS (cats-attendance.vercel.app)
└── scolagest.ftci.fr  → ScolaGest (scolagest.vercel.app)
```

---

## Étape 1 — Préparer le repo GitHub

Le repo doit contenir :
- Tout le code source (déjà fait)
- `astro.config.mjs` avec l'adapter Cloudflare (déjà fait)
- `public/_headers` et `public/_redirects` (déjà faits)

```bash
# Pousser les modifications récentes
git add .
git commit -m "feat: Cloudflare Pages deployment ready (adapter + KV + headers)"
git push origin main
```

---

## Étape 2 — Créer le projet Cloudflare Pages

### Option A : Via le Dashboard Cloudflare (recommandé)

1. Aller sur [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**

2. **Connecter GitHub** :
   - Autoriser Cloudflare à accéder au repo `ftechnologies18/ftci.vitrine`

3. **Configuration du build** :
   ```
   Project name:           ftci-vitrine
   Production branch:      main
   Framework preset:       Astro
   Build command:          pnpm run build
   Build output directory: dist
   Root directory:         (laisser vide)
   ```
   ⚠️ **Important** : ne PAS utiliser `dist/client` — Cloudflare Pages détecte automatiquement la structure `dist/client` + `dist/server` générée par l'adapter Astro.

4. **Variables d'environnement** (Settings → Environment variables) :
   ```
   NODE_VERSION = 22
   ```
   (Astro 7 requiert Node ≥ 22.12)

5. **Save and Deploy** — le premier build se lance (~2-3 min)

### Option B : Via Wrangler CLI

```bash
# Installer wrangler
pnpm add -g wrangler

# Login
wrangler login

# Premier déploiement
wrangler pages deploy dist --project-name=ftci-vitrine
```

---

## Étape 3 — Configurer le KV Namespace (pour le formulaire de contact)

Le formulaire `/api/contact` stocke les messages dans Cloudflare KV.

1. **Dashboard Cloudflare** → **Workers & Pages** → **KV** → **Create a namespace**
   ```
   Namespace name: MESSAGE_STORE
   ```

2. **Binder le KV au projet Pages** :
   - Aller sur le projet `ftci-vitrine` → **Settings** → **Functions** → **KV namespace bindings**
   - **Add binding** :
     ```
     Variable name: MESSAGE_STORE
     KV namespace:  MESSAGE_STORE
     Environment:   Production  (+ Preview)
     ```

3. **Redéployer** le projet pour activer le binding

> 💡 **Sans KV**, le formulaire fonctionne quand même (fallback `console.log`) mais les messages ne sont pas persistés. Le KV est **recommandé** pour ne pas perdre de messages.

---

## Étape 4 — Configurer le domaine ftci.fr

Le domaine est chez **AMEN**. Deux options :

### Option A : Garder le DNS chez AMEN (simple)

1. **Dashboard Cloudflare** → projet `ftci-vitrine` → **Custom domains** → **Set up a custom domain** → `ftci.fr`

2. Cloudflare génère un **CNAME target** du type :
   ```
   ftci-vitrine.pages.dev
   ```

3. **Chez AMEN** (interface d'administration DNS) :
   - Ajouter un **enregistrement CNAME** :
     ```
     Type:  CNAME
     Host:  @   (ou ftci.fr)
     Value: ftci-vitrine.pages.dev
     TTL:   3600
     ```
   - Ajouter aussi pour `www` :
     ```
     Type:  CNAME
     Host:  www
     Value: ftci-vitrine.pages.dev
     TTL:   3600
     ```

4. **Attendre la propagation DNS** (15 min - 24h selon le TTL)

5. **Vérifier** dans Cloudflare Pages → Custom domains → le statut doit passer à **Active**

⚠️ **Note sur le SSL** : Cloudflare fournit automatiquement un certificat SSL. Ne pas activer le SSL payant d'AMEN — cela créerait un conflit.

### Option B : Transférer le DNS vers Cloudflare (recommandé pour performance)

Cette option permet d'utiliser **toutes les fonctionnalités Cloudflare** (CDN, WAF, Page Rules, etc.).

1. **Dashboard Cloudflare** → **Add a site** → saisir `ftci.fr` → plan **Free**

2. Cloudflare scanne les enregistrements DNS existants et les importe

3. Cloudflare affiche **2 nameservers** du type :
   ```
   ns1.cloudflare.com (exemple)
   ns2.cloudflare.com (exemple)
   ```

4. **Chez AMEN** → interface de gestion du domaine → **changer les nameservers** :
   - Remplacer les nameservers AMEN par les 2 nameservers Cloudflare
   - **Attendre 24-48h** pour la propagation complète

5. Une fois le DNS transféré, gérer tous les enregistrements depuis le dashboard Cloudflare

#### Enregistrements DNS à ajouter dans Cloudflare :

```
Type   Name           Content                Proxy
A      ftci.fr        (auto Cloudflare)      Proxied
CNAME  www            ftci.fr                Proxied
CNAME  sect           sect-app.vercel.app    Proxied (ou DNS only selon Vercel)
CNAME  opuc           opuc.vercel.app        Proxied
CNAME  cats           cats-attendance.vercel.app  Proxied
CNAME  scolagest      scolagest.vercel.app   Proxied
```

⚠️ Pour les sous-domaines produits (Vercel) : vérifier la config côté Vercel. Vercel préfère souvent le DNS en mode "DNS only" (gray cloud) pour ses vérifications. Tester en mode "Proxied" d'abord, et passer en "DNS only" si problème.

---

## Étape 5 — Configurer les sous-domaines produits (Vercel)

Pour chaque produit (SECT, OPUC, CATS, ScolaGest) :

1. **Dashboard Vercel** → projet correspondant (ex: `sect-app`) → **Settings** → **Domains** → **Add** → `sect.ftci.fr`

2. Vercel affiche un **CNAME** à ajouter dans votre DNS (déjà fait à l'étape 4 si Option B)

3. Si Option A (DNS chez AMEN), ajouter le CNAME chez AMEN :
   ```
   Type:  CNAME
   Host:  sect
   Value: cname.vercel-dns.com
   ```

4. Vercel configure automatiquement le SSL pour le sous-domaine

5. Répéter pour `opuc`, `cats`, `scolagest`

---

## Étape 6 — Vérifications post-déploiement

### Tests à effectuer une fois le site en ligne :

```bash
# 1. Page d'accueil
curl -I https://ftci.fr
# → HTTP 200 + headers de sécurité présents

# 2. Pages produits
curl -I https://ftci.fr/solutions/sect
curl -I https://ftci.fr/solutions/opuc
curl -I https://ftci.fr/solutions/cats
curl -I https://ftci.fr/solutions/scolagest

# 3. Pages légales
curl -I https://ftci.fr/legal/mentions-legales
curl -I https://ftci.fr/legal/confidentialite
curl -I https://ftci.fr/legal/cgu

# 4. SEO endpoints
curl https://ftci.fr/robots.txt
curl https://ftci.fr/sitemap.xml

# 5. Formulaire de contact (KV storage)
curl -X POST https://ftci.fr/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","subject":"demo","message":"Test message for production verification.","consent":true}'
# → {"ok":true,"message":"Message reçu avec succès..."}

# 6. Redirection www
curl -I https://www.ftci.fr
# → 301 redirect vers https://ftci.fr

# 7. HTTPS forcé
curl -I http://ftci.fr
# → 301 redirect vers https://ftci.fr
```

### Tests visuels :
- [ ] Hero : mesh gradient animé + logo SVG qui se dessine
- [ ] Produits : tilt 3D au survol + lignes de connexion animées
- [ ] About : compteurs animés au scroll
- [ ] Services : icônes SVG stroke animation
- [ ] Contact : formulaire fonctionnel (vérifier le KV)
- [ ] Mobile : tilt 3D désactivé, curseur trail absent
- [ ] Reduced motion : animations désactivées

### Tests SEO :
- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — tester `https://ftci.fr`
- [ ] [Google PageSpeed Insights](https://pagespeed.web.dev/) — Core Web Vitals au vert
- [ ] [Open Graph Debugger](https://developers.facebook.com/tools/debug/) — preview Facebook
- [ ] Sitemap soumis dans [Google Search Console](https://search.google.com/search-console)

---

## 🔧 Déploiements ultérieurs

### Automatique (Git integration)
Chaque `git push` sur `main` déclenche un build + déploiement automatique sur Cloudflare Pages.

### Manuel (Wrangler CLI)
```bash
# Build local
pnpm run build

# Déployer
wrangler pages deploy dist --project-name=ftci-vitrine
```

---

## 🚨 Dépannage

### Le build échoue sur Cloudflare
- Vérifier `NODE_VERSION = 22` dans les variables d'environnement
- Consulter les logs de build dans le dashboard Cloudflare Pages

### Le formulaire renvoie 500
- Vérifier que le KV `MESSAGE_STORE` est bien bindé (Settings → Functions)
- Sans KV, le fallback console.log doit quand même renvoyer 200

### Le domaine ne pointe pas vers Cloudflare
- Vérifier les enregistrements CNAME chez AMEN (ou Cloudflare)
- Attendre la propagation DNS (jusqu'à 48h)
- Tester avec `dig ftci.fr` ou [dnschecker.org](https://dnschecker.org)

### SSL en erreur
- Ne pas activer le SSL AMEN si DNS chez AMEN (Cloudflare gère le SSL)
- Si DNS chez Cloudflare, le SSL est automatique

### Sous-domaines produits non accessibles
- Vérifier que le domaine personnalisé est ajouté dans chaque projet Vercel
- Vérifier les CNAME dans le DNS
- Vercel peut nécessiter 5-10 min pour activer un nouveau domaine

---

## 📊 Monitoring

### Cloudflare Analytics (gratuit)
- Dashboard Cloudflare → projet Pages → **Analytics**
- Métriques : requêtes, trafic, pays, statut HTTP

### Cloudflare Workers logs
- Dashboard → projet Pages → **Functions** → **Real-time logs**
- Permet de voir les logs du endpoint `/api/contact`

### Google Search Console
- Ajouter `ftci.fr` comme propriété
- Soumettre le sitemap : `https://ftci.fr/sitemap.xml`
- Suivre l'indexation des pages

---

## 📞 Contacts utiles

- **Cloudflare Support** : via le dashboard (plan gratuit = support communauté)
- **AMEN Support** : pour les questions DNS / nameservers
- **Vercel Support** : pour les sous-domaines produits

---

*Dernière mise à jour de ce guide : Juillet 2026*
