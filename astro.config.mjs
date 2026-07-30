// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

// Only use Cloudflare adapter in production (not dev)
// This avoids workerd crashes during local development
const isProduction = process.env.NODE_ENV === 'production';

let adapter;
if (isProduction) {
  const cloudflare = await import('@astrojs/cloudflare');
  adapter = cloudflare.default({
    // @ts-expect-error — platformProxy exists in the runtime but is not in the adapter's public type definitions.
    platformProxy: {
      enabled: true,
    },
  });
}

// https://astro.build/config
export default defineConfig({
  // Used by Astro.site, the sitemap, robots.txt, and SEO canonical/OG tags.
  // Keep it in sync with the production domain configured on the Worker.
  site: 'https://ftci.fr',

  // Astro 7 static mode: every route prerenders at build time unless it opts
  // out with `export const prerender = false` (see src/pages/api/contact.ts).
  // The Cloudflare adapter then serves those on-demand routes on the Workers
  // runtime while streaming the prerendered pages from static assets.
  ...(adapter ? { adapter } : {}),

  integrations: [
    react(),
    keystatic(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
