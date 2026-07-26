// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Used by Astro.site, the sitemap, robots.txt, and SEO canonical/OG tags.
  // Keep it in sync with the production domain configured on the Worker.
  site: 'https://ftci.fr',

  // Astro 7 static mode: every route prerenders at build time unless it opts
  // out with `export const prerender = false` (see src/pages/api/contact.ts).
  // The Cloudflare adapter then serves those on-demand routes on the Workers
  // runtime while streaming the prerendered pages from static assets.
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      // Exposes KV and other bindings declared in wrangler.jsonc to `astro dev`
      // via local emulation, so the contact endpoint can be exercised locally.
    },
  }),

  vite: {
    plugins: [tailwindcss()],
  },
});
