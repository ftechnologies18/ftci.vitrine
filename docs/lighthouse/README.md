# Rapports Lighthouse

Ce dossier contient les rapports d'audit Lighthouse exécutés sur le site en
production (https://ftci.fr) après les Lots 1-5 du plan Perf/SEO (11 août 2026).

## Conventions de nommage

`YYYY-MM-DD-<page>-<form-factor>.json`

- `<page>` : `home`, `blog-article`, `legal`, etc.
- `<form-factor>` : `mobile` ou `desktop`

## Rapports actuels (11 août 2026)

| Fichier                               | Page         | Perf | A11y | BP  | SEO  |
| ------------------------------------- | ------------ | ---- | ---- | --- | ---- |
| `2026-08-11-home-mobile.json`         | Home         | ?*   | 100  | 73  | 100  |
| `2026-08-11-blog-article-mobile.json` | Article blog | 91   | 91   | 73  | 100  |
| `2026-08-11-legal-mobile.json`        | Page légale  | 90   | 91   | 73  | 66** |

*Score perf null à cause du CLS=1 (pré-existant, à investiguer dans un Lot 7).
**SEO 66 attendu : `noindex={true}` intentionnel sur les pages légales.

## Comment visualiser un rapport

Les fichiers `.json` sont lisibles par :

- [Lighthouse Report Viewer](https://googlechrome.github.io/lighthouse/viewer/)
- `lighthouse viewer --output=html <file.json>` (génère un HTML interactif)

## Comment regénérer un audit

```bash
export CHROME_PATH="/path/to/chrome"
lighthouse https://ftci.fr/ \
  --output=json \
  --output-path=docs/lighthouse/$(date +%F)-home-mobile.json \
  --only-categories=performance,seo,accessibility,best-practices \
  --throttling-method=simulate \
  --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage"
```
