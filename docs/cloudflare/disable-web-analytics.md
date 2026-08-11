# Désactiver Cloudflare Web Analytics (Lot 10)

## Contexte

Le score **Best Practices Lighthouse** est bloqué à **81/100** à cause de
3 warnings deprecation :

1. `Shared Storage API is deprecated`
2. `StorageType.persistent is deprecated`
3. `Protected Audience API is deprecated`

Ces 3 APIs dépréciées sont utilisées par `beacon.min.js`, le script injecté
automatiquement par **Cloudflare Web Analytics** sur toutes les pages.

## Investigation Lot 10

Le token Cloudflare fourni (`cfat_...`) n'a **pas le scope "Web Analytics"**.
L'API endpoint `/accounts/{account_id}/web_analytics/sites` retourne
"Could not route" — ce qui est le comportement Cloudflare quand le token
manque le scope requis.

Le beacon est injecté par l'edge Cloudflare à runtime (pas par le Worker),
donc il ne peut pas être supprimé via le code de l'application.

## Solution : désactivation manuelle dans le dashboard

Pour passer Best Practices de **81 → 100**, désactiver Web Analytics :

### Étapes

1. Se connecter sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sélectionner le compte **Freelancetechnologies.ci@gmail.com's Account**
3. Sélectionner la zone **ftci.fr**
4. Naviguer vers **Analytics & Logs** → **Web Analytics**
5. Chercher le site `ftci.fr` dans la liste
6. Cliquer sur **Settings** (ou l'icône engrenage)
7. **Désactiver** "Auto-inject beacon" ou supprimer le site Web Analytics
8. Sauvegarder

### Vérification

Après désactivation, lancer un audit Lighthouse :

```bash
lighthouse https://ftci.fr/ \
  --only-categories=best-practices \
  --throttling-method=devtools \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
```

Le score Best Practices doit passer de **81 → 100** (les 3 deprecations
disparaissent car le script beacon.min.js n'est plus injecté).

### Alternative : recréer le token avec le scope Web Analytics

Si vous souhaitez le faire via API, créer un nouveau token Cloudflare avec
la permission **"Account" → "Web Analytics" → "Edit"**, puis :

```bash
CF_TOKEN='<nouveau_token>'
ACCOUNT_ID='319de93db5a99db76b4bf41f9d06b785'

# Lister les sites Web Analytics
curl -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/web_analytics/sites" \
  -H "Authorization: Bearer $CF_TOKEN"

# Désactiver l'auto-injection du beacon (remplacer {site_tag})
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/web_analytics/sites/{site_tag}" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"auto_install": false}'
```

## Impact attendu

| Métrique         | Avant      | Après       |
| ---------------- | ---------- | ----------- |
| Best Practices   | 81/100     | **100/100** |
| Deprecations     | 3 warnings | **0**       |
| Console errors   | 0          | **0**       |
| Inspector issues | 0          | **0**       |

## Note

Désactiver Web Analytics supprime les statistiques de visite Cloudflare
(utiles pour le trafic, mais non essentielles si vous utilisez Google
Analytics ou un autre outil). Les deprecations disparaîtront aussi quand
Cloudflare mettra à jour son beacon pour ne plus utiliser les APIs
dépréciées (Shared Storage, Protected Audience).
