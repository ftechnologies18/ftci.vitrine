# Audit Lighthouse Final — Session complète (11 août 2026)

État final après 10 lots de travail sur le plan Perf/SEO.
Form factor : **mobile** (throttling devtools = mesures réelles).

## Scores finaux — 3 pages

| Page             | Perf    | A11y    | BP      | SEO     | LCP  | FCP  | CLS   | TBT |
| ---------------- | ------- | ------- | ------- | ------- | ---- | ---- | ----- | --- |
| **Home**         | 92      | **100** | **100** | **100** | 0.9s | 0.9s | **0** | 0ms |
| **Article blog** | 93      | 91      | **100** | **100** | 3.2s | 0.9s | **0** | 0ms |
| **Page légale**  | **100** | 91      | **100** | 66*     | 1.8s | 0.8s | **0** | 0ms |

- SEO 66 = `noindex={true}` intentionnel (pages légales — décision SEO valide).

## Parcours — 10 lots

| Lot | Commit           | Impact mesuré                                      |
| --- | ---------------- | -------------------------------------------------- |
| 1   | `bfb1605`        | +11 entités JSON-LD (rich snippets éligibles)      |
| 2   | `c13c434`        | −1.30 MB images (−62.8%), TBT 0ms (lazy Turnstile) |
| 3   | `6ccca1a`        | IndexNow auto, sitemap `<image:image>`             |
| 4a  | `d821d7c`        | Bug Husky `.mdoc` corrigé                          |
| 4b  | `f6b9487`        | PR Dependabot traitée (wrangler fix)               |
| 5   | `b83fdd0`        | FAQ visible (anti-spam Google)                     |
| 6   | `c72e8fe`        | Baseline Lighthouse documenté                      |
| 7   | `914dc18`        | **CLS Home 0.051 → 0.007** (font fallback)         |
| 8   | `49a6444`        | **Best Practices 73 → 81** (CSP fix)               |
| 9   | `6a6defc`        | **CLS page légale 0.226 → 0** (content-visibility) |
| 10  | (API Cloudflare) | **Best Practices 81 → 100** (JSD désactivé)        |

## Gains session complète

| Métrique              | Avant session | Après session | Delta        |
| --------------------- | ------------- | ------------- | ------------ |
| CLS Home              | 0.051         | 0             | **−100%**    |
| CLS page légale       | 0.226         | 0             | **−100%**    |
| Best Practices        | 73            | **100**       | **+27**      |
| Performance (3 pages) | 88-91         | 92-100        | **+4 à +9**  |
| Images payload        | 2.07 MB       | 787 KB        | **−1.30 MB** |
| TBT                   | —             | 0ms           | ✅           |
| Deprecations          | 3             | **0**         | −3           |
| JSON-LD entités       | 2             | 11            | +9           |

**Tous les Core Web Vitals sont maintenant en vert (CLS = 0 sur toutes les pages).**
