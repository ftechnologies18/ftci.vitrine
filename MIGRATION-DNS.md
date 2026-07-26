# Migration DNS AMEN → Cloudflare — ftci.fr

Guide pas à pas pour transférer le DNS de `ftci.fr` d'AMEN vers Cloudflare **sans perte de service** (email, site, sous-domaines).

---

## ⚠️ État actuel du DNS (à préserver)

| Type | Host | Valeur | Criticité |
|------|------|--------|-----------|
| **NS** | ftci.fr | ns1.amenworld.com, ns2.amenworld.com | Sera remplacé |
| **A** | ftci.fr | 81.88.57.68 (parking AMEN) | À remplacer |
| **CNAME** | www | onstatic-fr.setupdns.net | À remplacer |
| **MX** ⚠️ | ftci.fr | 10 mail-fr.securemail.pro | **EMAIL — NE PAS PERDRE** |
| **TXT** ⚠️ | ftci.fr | v=spf1 include:spf.webapps.net ~all | **SPF — NE PAS PERDRE** |
| CNAME | sect | onstatic-fr.setupdns.net (parking) | À remplacer → Vercel |
| (vide) | opuc | — | À créer → Vercel |
| (vide) | cats | — | À créer → Vercel |
| CNAME | scolagest | onstatic-fr.setupdns.net (parking) | À remplacer → Vercel |

**Service email critique** : `contact@ftci.fr` utilise probablement `mail-fr.securemail.pro` (AMEN Securemail). Les enregistrements MX et SPF doivent être repris **avant** le changement de nameservers.

---

## 📋 Checklist de migration (à cocher)

- [ ] **Étape 1** : Ajouter ftci.fr à Cloudflare
- [ ] **Étape 2** : Vérifier les enregistrements DNS importés
- [ ] **Étape 3** : Ajouter les enregistrements manquants (sous-domaines Vercel)
- [ ] **Étape 4** : Récupérer les nameservers Cloudflare
- [ ] **Étape 5** : Changer les nameservers chez AMEN
- [ ] **Étape 6** : Attendre la propagation (24-48h)
- [ ] **Étape 7** : Configurer SSL/TLS sur Cloudflare
- [ ] **Étape 8** : Configurer le domaine personnalisé sur Cloudflare Pages
- [ ] **Étape 9** : Ajouter les sous-domaines sur Vercel
- [ ] **Étape 10** : Vérifications finales

---

## Étape 1 — Ajouter ftci.fr à Cloudflare

1. Aller sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. Cliquer **"Add a site"** (ou **"Add domain"**)
3. Saisir : `ftci.fr` → Cliquer **Continue**
4. Choisir le plan : **Free** (suffisant pour commencer)
5. Cloudflare scanne les enregistrements DNS existants et les importe automatiquement

> 💡 Cloudflare va détecter automatiquement les enregistrements A, CNAME, MX et TXT existants. Vérifier quand même à l'étape 2.

---

## Étape 2 — Vérifier les enregistrements DNS importés

Sur la page **DNS → Records** du domaine `ftci.fr`, vérifier que ces enregistrements critiques sont bien présents :

### ✅ À VÉRIFIER ABSOLUMENT (email)

```
Type: MX
Name: ftci.fr (ou @)
Mail server: mail-fr.securemail.pro
Priority: 10
Proxy status: DNS only (gray cloud) ← IMPORTANT ! Pas de proxy pour MX

Type: TXT
Name: ftci.fr (ou @)
Content: v=spf1 include:spf.webapps.net ~all
```

> ⚠️ **Si ces enregistrements ne sont pas importés, les ajouter manuellement avant de continuer.** Sans eux, les emails `@ftci.fr` ne fonctionneront plus.

### Enregistrements à MODIFIER (site vitrine)

Cloudflare Pages va configurer automatiquement l'enregistrement A/CNAME pour le site vitrine une fois le domaine personnalisé ajouté (étape 8). Pour l'instant, laisser l'enregistrement A existant (parking AMEN) — il sera écrasé par Cloudflare Pages.

### Enregistrements à SUPPRIMER (parking AMEN des sous-domaines)

Supprimer ces enregistrements obsolètes (ils pointent vers du parking AMEN) :
```
- CNAME sect → onstatic-fr.setupdns.net
- A sect → 81.88.57.68
- CNAME scolagest → onstatic-fr.setupdns.net
- A scolagest → 81.88.57.68
```

> On va recréer ces sous-domaines propres à l'étape 3.

---

## Étape 3 — Ajouter les enregistrements pour les sous-domaines Vercel

Ajouter ces 4 enregistrements CNAME dans **DNS → Records → Add record** :

```
Type: CNAME
Name: sect
Target: sect-app.vercel.app
Proxy status: DNS only (gray cloud) ← IMPORTANT pour Vercel
TTL: Auto

Type: CNAME
Name: opuc
Target: opuc.vercel.app
Proxy status: DNS only (gray cloud)
TTL: Auto

Type: CNAME
Name: cats
Target: cats-attendance.vercel.app
Proxy status: DNS only (gray cloud)
TTL: Auto

Type: CNAME
Name: scolagest
Target: scolagest.vercel.app
Proxy status: DNS only (gray cloud)
TTL: Auto
```

> ⚠️ **Pourquoi "DNS only" (gray cloud) et pas "Proxied" (orange cloud) pour les sous-domaines Vercel ?**
> Vercel vérifie la propriété du domaine via le DNS. Le proxy Cloudflare peut casser cette vérification. Laisser en "DNS only" — le SSL est géré par Vercel directement.
>
> Si tu veux quand même le proxy Cloudflare (pour le WAF), tester d'abord en "Proxied" et vérifier que Vercel accepte le domaine. Revenir en "DNS only" en cas de problème.

### Récapitulatif final des enregistrements DNS Cloudflare :

```
Type   Name        Content                        Proxy
MX     ftci.fr     mail-fr.securemail.pro         DNS only
TXT    ftci.fr     v=spf1 include:spf.webapps.net ~all  DNS only
CNAME  www         ftci-vitrine.pages.dev         Proxied
CNAME  sect        sect-app.vercel.app            DNS only
CNAME  opuc        opuc.vercel.app                DNS only
CNAME  cats        cats-attendance.vercel.app     DNS only
CNAME  scolagest   scolagest.vercel.app           DNS only
(A     ftci.fr     configuré auto par Pages       Proxied)
```

---

## Étape 4 — Récupérer les nameservers Cloudflare

1. Sur la page d'accueil du domaine `ftci.fr` dans Cloudflare
2. Cliquer sur **"Check nameservers"** ou aller dans **DNS → Settings**
3. Cloudflare affiche 2 nameservers du type :
   ```
   adam.ns.cloudflare.com    (exemple — les tiens seront différents)
   linda.ns.cloudflare.com   (exemple)
   ```

> 📝 **Noter ces 2 nameservers** — tu en as besoin pour l'étape 5.

---

## Étape 5 — Changer les nameservers chez AMEN

1. Aller sur [amen.fr](https://www.amen.fr) → se connecter à ton compte client
2. Aller dans **Mes domaines** → cliquer sur `ftci.fr`
3. Chercher la section **"Nameservers"** ou **"Serveurs de noms"** ou **"Gestion DNS"**
4. Remplacer les nameservers AMEN par les 2 nameservers Cloudflare :
   ```
   ns1.amenworld.com  →  adam.ns.cloudflare.com  (exemple)
   ns2.amenworld.com  →  linda.ns.cloudflare.com  (exemple)
   ```
5. Valider la modification

> ⚠️ **Important** : AMEN peut afficher un message d'avertissement ("vous quittez notre DNS"). C'est normal — tu transfères juste la gestion DNS, pas le domaine (le domaine reste enregistré chez AMEN, tu le renouvelleras toujours chez AMEN).

> 💡 **Délai AMEN** : la modification peut prendre de quelques minutes à quelques heures pour être effective chez AMEN. Ensuite, la propagation mondiale prend 24-48h.

---

## Étape 6 — Attendre la propagation (24-48h)

### Surveiller la propagation

1. **Dashboard Cloudflare** → **Overview** → le statut doit passer de **"Pending nameserver update"** à **"Active"**

2. **Outil de vérification externe** : [dnschecker.org](https://dnschecker.org/#NS/ftci.fr)
   - Saisir `ftci.fr` → type `NS`
   - Vérifier que les nameservers Cloudflare apparaissent partout dans le monde

3. **Vérification CLI** (sur ton ordinateur) :
   ```bash
   dig NS ftci.fr +short
   # Doit afficher les 2 nameservers Cloudflare (et plus amenworld.com)
   ```

### Pendant la propagation

- ⚠️ **Ne pas supprimer le compte AMEN ni le domaine** — le domaine doit rester enregistré chez AMEN
- ⚠️ **Le site peut être temporairement inaccessible** pendant quelques heures pendant le changement
- ⚠️ **Les emails peuvent avoir un délai** le temps que les MX se propagent

### Quand Cloudflare affiche "Active"

Continuer avec les étapes 7-10.

---

## Étape 7 — Configurer SSL/TLS sur Cloudflare

1. Dashboard Cloudflare → `ftci.fr` → **SSL/TLS** → **Overview**
2. Choisir le mode : **Full (strict)** (recommandé — nécessite un certificat valide côté serveur, ce que Cloudflare Pages et Vercel fournissent automatiquement)

3. **Edge Certificates** (SSL/TLS → Edge Certificates) :
   - ✅ Always Use HTTPS : **ON**
   - ✅ HTTP Strict Transport Security (HSTS) : **ON** (après tests)
   - ✅ Automatic HTTPS Rewrites : **ON**
   - ✅ Minimum TLS Version : **1.2**

> 💡 Le SSL est **gratuit** et **automatique** sur Cloudflare. Le certificat se renouvelle tous les 3 mois sans action de ta part.

---

## Étape 8 — Configurer le domaine personnalisé sur Cloudflare Pages

1. Dashboard Cloudflare → **Workers & Pages** → projet `ftci-vitrine` → **Custom domains** → **Set up a custom domain**

2. Saisir : `ftci.fr` → **Continue**

3. Cloudflare va automatiquement :
   - Ajouter l'enregistrement A/CNAME necessary dans le DNS
   - Activer le SSL
   - Rediriger le trafic vers ton Pages

4. Répéter pour `www.ftci.fr` :
   - **Set up a custom domain** → `www.ftci.fr`
   - Cloudflare va créer le CNAME automatiquement

5. Vérifier que le statut passe à **Active** pour les deux domaines (peut prendre 5-15 min)

### Redirection www → apex (recommandé)

Pour rediriger `www.ftci.fr` vers `ftci.fr` (meilleur pour le SEO) :

1. Dashboard Cloudflare → **Rules** → **Redirect Rules** → **Create rule**
2. Configuration :
   ```
   Rule name: www to apex
   When: Hostname equals "www.ftci.fr"
   Then: Redirect to URL "https://ftci.fr/{path}"
   Status code: 301
   Preserve query string: ON
   ```

---

## Étape 9 — Configurer les sous-domaines sur Vercel

Pour chaque produit (SECT, OPUC, CATS, ScolaGest), répéter :

1. Dashboard Vercel → projet correspondant (ex: `sect-app`) → **Settings** → **Domains**
2. **Add** → saisir : `sect.ftci.fr` → **Add**
3. Vercel vérifie le DNS (peut prendre 1-5 min)
4. Statut doit passer à **"Valid Configuration"** ✅

> Si Vercel affiche "Invalid Configuration", vérifier que :
> - Le CNAME est bien en "DNS only" (gray cloud) sur Cloudflare
> - La valeur du CNAME correspond exactement (ex: `sect-app.vercel.app`)
> - Attendre 5 min pour la propagation DNS

Répéter pour `opuc.ftci.fr`, `cats.ftci.fr`, `scolagest.ftci.fr`.

---

## Étape 10 — Vérifications finales

### Tests à effectuer une fois tout en place (attends 30 min après configuration) :

```bash
# 1. Site vitrine
curl -I https://ftci.fr
# → HTTP 200 + headers Cloudflare (cf-ray, server: cloudflare)

# 2. Redirection www → apex
curl -I https://www.ftci.fr
# → 301 Location: https://ftci.fr/

# 3. HTTPS forcé
curl -I http://ftci.fr
# → 301 Location: https://ftci.fr/

# 4. Pages produits
curl -I https://ftci.fr/solutions/sect
curl -I https://ftci.fr/solutions/opuc
curl -I https://ftci.fr/solutions/cats
curl -I https://ftci.fr/solutions/scolagest

# 5. Pages légales
curl -I https://ftci.fr/legal/mentions-legales
curl -I https://ftci.fr/legal/confidentialite
curl -I https://ftci.fr/legal/cgu

# 6. SEO endpoints
curl https://ftci.fr/robots.txt
curl https://ftci.fr/sitemap.xml

# 7. Formulaire de contact
curl -X POST https://ftci.fr/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Production","email":"test@example.com","subject":"demo","message":"Testing production contact form","consent":true}'

# 8. Sous-domaines produits (Vercel)
curl -I https://sect.ftci.fr
curl -I https://opuc.ftci.fr
curl -I https://cats.ftci.fr
curl -I https://scolagest.ftci.fr

# 9. Vérifier que l'email fonctionne (MX record)
dig MX ftci.fr +short
# → 10 mail-fr.securemail.pro

# 10. Vérifier SPF
dig TXT ftci.fr +short
# → "v=spf1 include:spf.webapps.net ~all"

# 11. Tester l'envoi d'un email à contact@ftci.fr pour vérifier la réception
```

### Tests visuels :
- [ ] https://ftci.fr affiche le site FTCI avec le hero animé
- [ ] Les 4 pages produits sont accessibles
- [ ] Le formulaire de contact renvoie un succès
- [ ] Les 4 sous-domaines produits chargent leurs applications respectives

### Tests SEO :
- [ ] Soumettre `https://ftci.fr/sitemap.xml` dans [Google Search Console](https://search.google.com/search-console)
- [ ] Tester les données structurées avec [Rich Results Test](https://search.google.com/test/rich-results)

---

## 🚨 Dépannage

### "Le site ne se charge pas après changement de NS"
1. Vérifier dans Cloudflare que le statut est "Active" (pas "Pending")
2. Vérifier que l'enregistrement A/CNAME pour `ftci.fr` existe dans DNS → Records
3. Vider le cache DNS local : `sudo systemd-resolve --flush-caches` ou `ipconfig /flushdns`

### "Les emails ne fonctionnent plus"
1. Vérifier que les enregistrements MX et TXT (SPF) sont présents dans Cloudflare DNS
2. Vérifier que le proxy est **DNS only** (gray cloud) pour le MX
3. Tester l'envoi d'un email depuis une adresse externe (Gmail) vers contact@ftci.fr

### "Vercel dit Invalid Configuration pour sect.ftci.fr"
1. Vérifier le CNAME dans Cloudflare DNS → valeur exacte `sect-app.vercel.app`
2. Vérifier que le proxy est **DNS only** (gray cloud)
3. Attendre 5-10 min pour la propagation
4. En dernier recours, cliquer "Refresh" dans Vercel → Domains

### "Certificat SSL en erreur"
1. SSL/TLS → Overview → vérifier que le mode est **Full (strict)** (pas Flexible)
2. Edge Certificates → vérifier que "Universal SSL" est actif
3. Attendre 15 min pour l'émission du certificat (peut prendre jusqu'à 24h en cas de pic)

### "Je veux revenir en arrière"
- Revenir chez AMEN : remettre `ns1.amenworld.com` et `ns2.amenworld.com` comme nameservers
- Délai : 24-48h pour la propagation du retour

---

## 📞 Support

- **AMEN** : support client AMEN pour la modification des nameservers
- **Cloudflare** : [community.cloudflare.com](https://community.cloudflare.com) (support gratuit)
- **Vercel** : support via le dashboard Vercel (plan gratuit = support communauté)

---

## ✅ Après validation

Une fois tout fonctionnel :
1. Mettre à jour le `DEPLOYMENT.md` avec la date de mise en production
2. Configurer des alertes uptime (ex: [UptimeRobot](https://uptimerobot.com) — gratuit)
3. Surveiller les premiers jours les logs Cloudflare pour détecter d'éventuelles erreurs 5xx

Bon déploiement ! 🚀
