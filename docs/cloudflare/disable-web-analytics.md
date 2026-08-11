# Désactiver Cloudflare JavaScript Detections (Lot 10 — résolu)

## Contexte

Le score **Best Practices Lighthouse** était bloqué à **81/100** à cause de
3 warnings deprecation :

1. `Shared Storage API is deprecated`
2. `StorageType.persistent is deprecated`
3. `Protected Audience API is deprecated`

## Investigation (corrigée)

**Hypothèse initiale (erronée)** : le beacon `cloudflareinsights.com` injecté
par Cloudflare Web Analytics. Vérification : le beacon n'apparaît pas dans
le HTML curl — il n'est PAS injecté par Web Analytics.

**Cause réelle** : le script `/cdn-cgi/challenge-platform/scripts/jsd/main.js`
injecté par **Bot Management → JavaScript Detections (JSD)**. Ce script de
fingerprinting navigateur utilise les 3 APIs dépréciées pour la détection
de bots.

Visible dans le HTML live :

```html
<script>
	(function(){
	  ...
	  var a=document.createElement('script');
	  a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';
	  ...
	})();
</script>
```

## Solution appliquée (via API Cloudflare)

Le token Cloudflare fourni avait les permissions "Bot Management" sur la zone.
Désactivation via l'API le 11 août 2026 :

```bash
CF_TOKEN='<token>'
ZONE_ID='cffc468759c5bbf04988111885215ba8'

# Vérifier l'état avant
curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/bot_management" \
  -H "Authorization: Bearer $CF_TOKEN"
# → {"enable_js": true, "fight_mode": false, ...}

# Désactiver uniquement enable_js (JSD), préserver le reste
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/bot_management" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enable_js": false}'

# Vérifier après
curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/bot_management" \
  -H "Authorization: Bearer $CF_TOKEN"
# → {"enable_js": false, "fight_mode": false, ...}
```

**Note** : `PATCH` n'est pas supporté pour cette authentification — utiliser `PUT`
avec le corps minimal `{"enable_js": false}` (les autres champs sont préservés).

## Impact mesuré

| Métrique             | Avant      | Après       | Delta      |
| -------------------- | ---------- | ----------- | ---------- |
| **Best Practices**   | 81/100     | **100/100** | **+19** ✨ |
| Deprecations         | 3 warnings | **0**       | −3         |
| Console errors       | 0          | 0           | stable     |
| Inspector issues     | 0          | 0           | stable     |
| Script JSD dans HTML | présent    | **absent**  | supprimé   |

## État final — 3 pages (post Lot 10)

| Page         | Perf    | A11y | BP      | SEO | LCP  | CLS | TBT |
| ------------ | ------- | ---- | ------- | --- | ---- | --- | --- |
| Home         | 92      | 100  | **100** | 100 | 0.9s | 0   | 0ms |
| Article blog | 93      | 91   | **100** | 100 | 3.2s | 0   | 0ms |
| Page légale  | **100** | 91   | **100** | 66* | 1.8s | 0   | 0ms |

- SEO 66 = `noindex={true}` intentionnel sur les pages légales (décision SEO valide).

## Sécurité — compromis

Désactiver JavaScript Detections (JSD) réduit la précision de la détection
de bots Cloudflare. Pour un site vitrine sans formulels sensibles (le
formulaire de contact est protégé par Cloudflare Turnstile), ce compromis
est acceptable : Turnstile fournit une protection anti-bot au niveau du
formulaire, indépendante de JSD.

Si FTCI devait faire face à des attaques de bots massives à l'avenir, JSD
pourrait être réactivé temporairement :

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/bot_management" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enable_js": true}'
```
