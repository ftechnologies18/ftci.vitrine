/**
 * Cloudflare Workers environment bindings for FTCI.
 *
 * This file provides the `Env` interface used by `import { env } from 'cloudflare:workers'`
 * in src/pages/api/contact.ts. It is a minimal, hand-maintained declaration that
 * mirrors the bindings configured in wrangler.jsonc.
 *
 * For the full runtime types (KVNamespace, D1Database, R2Bucket, etc.),
 * run `pnpm run types` (wrangler types) locally to generate worker-configuration.d.ts.
 * That generated file is gitignored (550KB, regenerable) and overrides this
 * declaration when present.
 *
 * Keep this file in sync with wrangler.jsonc when adding/removing bindings.
 */
interface Env {
	/** KV namespace for contact form messages. Keyed by messages/YYYY/MM/<id>. */
	MESSAGE_STORE?: KVNamespace;
	/** Node version hint for the build environment (set in wrangler.jsonc env.vars). */
	NODE_VERSION?: string;
}
