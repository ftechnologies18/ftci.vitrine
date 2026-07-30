/**
 * /api/keystatic/[...params] — Route API Keystatic (contournement).
 *
 * Cette route devrait être injectée automatiquement par @keystatic/astro via
 * `injectRoute()` dans son hook `astro:config:setup`. Mais en Astro 7 + adapter
 * Cloudflare 14, les routes API injectées par les intégrations ne sont pas
 * correctement matchées par le routeur à runtime (404 "Not Found" retourné
 * par le static asset handler Cloudflare avant que le Worker ne puisse traiter
 * la requête, bien que la route soit présente dans le manifest avec
 * `prerender: false` et `origin: external`).
 *
 * Contournement : on crée manuellement la route ici, ce qui en fait une route
 * "native" d'Astro qui est correctement matchée. On importe le handler Keystatic
 * et on le forward. Le patch pnpm sur @keystatic/astro (qui utilise
 * `cloudflare:workers` au lieu de `locals.runtime.env`) reste nécessaire et est
 * appliqué automatiquement.
 *
 * Une fois le bug corrigé côté @keystatic/astro, ce fichier pourra être
 * supprimé sans impact (l'injection reprendra le dessus).
 */

import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
// eslint-disable-next-line import/no-unresolved
import config from 'virtual:keystatic-config';

export const prerender = false;

const handler = makeHandler({ config });

export const ALL: APIRoute = async (ctx) => {
        return handler(ctx);
};
