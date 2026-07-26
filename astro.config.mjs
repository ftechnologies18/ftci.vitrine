// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // URL canonique du site — utilisée par Astro.site, le sitemap, et les meta tags SEO.
  site: 'https://ftci.fr',

  // Astro 7 : le mode "static" (défaut) se comporte comme l'ancien "hybrid".
  // Toutes les pages sont pré-rendues en statique par défaut,
  // sauf les routes qui ont explicitement `export const prerender = false`
  // (comme /api/contact) qui sont rendues on-demand par le worker Cloudflare.

  adapter: cloudflare({
    platformProxy: {
      enabled: true, // Permet d'utiliser wrangler dev / bindings locaux
                },
  }),

  vite: {
    plugins: [tailwindcss()],
  },
});
