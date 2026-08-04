/**
 * Cloudflare Workers environment bindings for FTCI.
 *
 * This file provides the `Env` interface used by `import { env } from 'cloudflare:workers'`
 * in src/pages/api/contact.ts. It is a minimal, hand-maintained declaration that
 * mirrors the bindings configured in wrangler.jsonc and the dashboard.
 *
 * For the full runtime types (KVNamespace, D1Database, R2Bucket, etc.),
 * run `pnpm run types` (wrangler types) locally to generate worker-configuration.d.ts.
 * That generated file is gitignored (550KB, regenerable) and declares:
 *
 *   interface __BaseEnv_Env { MESSAGE_STORE: KVNamespace; }
 *   declare namespace Cloudflare { interface Env extends __BaseEnv_Env {} }
 *   interface Env extends __BaseEnv_Env {}
 *   declare module 'cloudflare:workers' { export const env: Cloudflare.Env; }
 *
 * The `cloudflare:workers` `env` export is typed as `Cloudflare.Env`, which only
 * contains the wrangler.jsonc bindings. Secrets set via `wrangler secret put`
 * are NOT in wrangler.jsonc, so we declare them here via TypeScript namespace
 * merging on `Cloudflare.Env` (and on the global `Env` for completeness).
 * Declaration merging combines our optional fields with the generated ones.
 */

/**
 * Merge secret declarations into the generated `Cloudflare.Env` namespace.
 * This is what `import { env } from 'cloudflare:workers'` actually returns.
 */
declare namespace Cloudflare {
	interface Env {
		/** Resend API key (https://resend.com/api-keys). Optional: when unset, email dispatch is skipped. */
		RESEND_API_KEY?: string;
		/** Discord webhook URL (https://discord.com/api/webhooks/...). Optional: when unset, Discord dispatch is skipped. */
		DISCORD_WEBHOOK_URL?: string;
		/** Resend Audience ID for newsletter subscriptions. Create at https://resend.com/audiences. */
		RESEND_AUDIENCE_ID?: string;
	}
}

/** Global Env interface — merges with the generated `interface Env extends __BaseEnv_Env {}`. */
interface Env {
	/** KV namespace for contact form messages. Keyed by messages/YYYY/MM/<id>. */
	MESSAGE_STORE?: KVNamespace;
	/** Node version hint for the build environment (set in wrangler.jsonc env.vars). */
	NODE_VERSION?: string;

	// ── Secrets (set via `wrangler secret put` or dashboard, never in wrangler.jsonc) ──

	/**
	 * Resend API key used to send the team notification email and the
	 * visitor confirmation email. Create one at https://resend.com/api-keys
	 * and bind it as a Worker secret. Optional: when unset, the contact
	 * form still stores messages in KV but skips email dispatch.
	 */
	RESEND_API_KEY?: string;

	/**
	 * Discord webhook URL (https://discord.com/api/webhooks/...) used for
	 * real-time team notifications. Create one from a Discord channel's
	 * "Integrations → Webhooks" menu and bind it as a Worker secret.
	 * Optional: when unset, Discord dispatch is skipped.
	 */
	DISCORD_WEBHOOK_URL?: string;
}

// ── Virtual modules (résolus au runtime par Vite/Astro, pas par TS) ──────────

/**
 * Module virtuel injecté par @keystatic/astro via Vite plugin. Contient la
 * config Keystatic (export default) résolue depuis `keystatic.config.ts`.
 * La déclaration ici évite les erreurs TS "Cannot find module" au type-check.
 */
declare module 'virtual:keystatic-config' {
	import type { Config } from '@keystatic/core';
	const config: Config;
	export default config;
}
