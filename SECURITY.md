# Politique de sécurité — FTCI Vitrine

## 🔒 Signaler une vulnérabilité

**Ne PAS ouvrir une issue publique** pour signaler une vulnérabilité de sécurité.

À la place, envoyez un email à **freelancetechnologies.ci@gmail.com** avec :

- Une description du problème
- Les étapes pour le reproduire
- L'impact potentiel
- Si possible, une suggestion de correctif

Nous nous engageons à :

- Accuser réception sous **48h ouvrées**
- Vous tenir informé de l'avancement du fix
- Créditer (si vous le souhaitez) dans le CHANGELOG une fois le fix déployé

## 🛡️ Mesures de sécurité en place

Le projet applique les bonnes pratiques suivantes :

### Headers de sécurité (Cloudflare Workers)

- `Content-Security-Policy` : restrictif (self + Keystatic Cloud uniquement)
- `Strict-Transport-Security` : HSTS 2 ans + preload + subdomains
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` : camera, microphone, geolocation désactivés

### Validation & sanitization

- Tous les inputs utilisateur sont validés (form contact, content collections)
- `safeJsonStringify()` pour prévenir le XSS via JSON-LD (`</script>` injection)
- Échappement HTML systématique dans les templates Astro
- Honeypot + rate limit (KV distribué) sur le formulaire de contact

### Secrets

- Aucun secret dans le code source (vérifié par ESLint + review manuelle)
- Tous les secrets sont bindés via `wrangler secret put` (chiffrés côté Cloudflare)
- `.gitignore` exclut `.env`, `.env.production`, `.wrangler/`

### Cookies

- `HttpOnly: true` par défaut (anti-XSS theft)
- `Secure: true` en production (HTTPS only)
- `SameSite: 'lax'` par défaut (anti-CSRF)

### CSRF

- Vérification `Origin`/`Referer` contre allowlist sur `/api/contact`
- Honeypot field sur le formulaire (anti-bot)

### Rate limiting

- `/api/contact` : 3 requêtes / minute / IP (KV distribué, fiable entre isolates)

## 🔄 Dépendances

- `pnpm audit` exécuté à chaque PR (workflow GitHub Actions)
- Dependabot actif pour les mises à jour de sécurité (voir `.github/dependabot.yml`)
- Override `minimatch@^10` pour éviter la CVE `brace-expansion` (voir `package.json` → `pnpm.overrides`)

## 📋 Audit de sécurité

Le dernier audit complet a été effectué en juillet 2026 (voir commit `b6c5a0f`).
13 failles ont été identifiées et corrigées (4 HIGH, 5 MEDIUM, 4 LOW).

Pour refaire un audit :

```bash
pnpm audit                    # vulnérabilités connues
pnpm lint                     # code quality / mauvaises pratiques
pnpm exec astro check         # type safety
```
