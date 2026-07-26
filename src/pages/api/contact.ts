/**
 * Contact form endpoint for the FTCI vitrine site.
 *
 * Receives POST submissions from the home page {@linkcode /src/components/Contact.astro}
 * form, validates them, and persists accepted messages to the Cloudflare KV
 * namespace bound as `MESSAGE_STORE`. Runs on-demand on the Cloudflare Workers
 * runtime (see {@linkcode prerender}); it must not depend on Node.js built-ins
 * because the Workers V8 isolate does not provide them.
 *
 * Pipeline:
 *   1. IP-based rate limiting (per worker isolate, see {@linkcode rateLimited}).
 *   2. JSON body parsing.
 *   3. Field validation, including a honeypot field that silently reports
 *      success to suspected bots.
 *   4. Persistence to KV with a `messages/YYYY/MM/<id>` key layout for
 *      date-prefix listings, or a `console.log` fallback in local dev.
 *
 * Bindings: declare `MESSAGE_STORE` in `wrangler.jsonc` under `kv_namespaces`
 * and run `wrangler types` to refresh `worker-configuration.d.ts` when the
 * binding set changes.
 *
 * TODO: send an email notification (Resend/SendGrid/Mailgun) to the FTCI team
 * using a secret bound in the Workers dashboard, instead of only persisting.
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/** Force on-demand rendering. Static prerendering would freeze the route at build time. */
export const prerender = false;

const SUBJECTS = ['consultation', 'demo', 'partnership', 'support', 'other'] as const;
type Subject = (typeof SUBJECTS)[number];

interface ContactPayload {
	name?: unknown;
	email?: unknown;
	subject?: unknown;
	message?: unknown;
	consent?: unknown;
	website?: unknown;
}

interface StoredMessage {
	id: string;
	receivedAt: string;
	name: string;
	email: string;
	subject: Subject;
	message: string;
	ip: string | null;
	userAgent: string | null;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a parsed payload and returns a map of `fieldName → user-facing error`.
 * An empty map means the payload is acceptable.
 *
 * The `_honeypot` key is set when the hidden `website` field is non-empty,
 * signalling a bot submission. Callers should treat that case as a silent
 * success (see the POST handler).
 */
function validate(payload: ContactPayload): Record<string, string> {
	const errors: Record<string, string> = {};

	// Honeypot: legitimate users leave the hidden `website` field empty.
	if (isString(payload.website) && payload.website.trim() !== '') {
		errors._honeypot = 'spam detected';
		return errors;
	}

	const name = isString(payload.name) ? payload.name.trim() : '';
	if (!name) errors.name = 'Le nom est obligatoire.';
	else if (name.length < 2) errors.name = 'Le nom doit comporter au moins 2 caractères.';
	else if (name.length > 100) errors.name = 'Le nom est trop long (max 100 caractères).';

	const email = isString(payload.email) ? payload.email.trim() : '';
	if (!email) errors.email = "L'adresse email est obligatoire.";
	else if (!EMAIL_RE.test(email)) errors.email = "L'adresse email est invalide.";
	else if (email.length > 254) errors.email = "L'adresse email est trop longue.";

	const subject = isString(payload.subject) ? payload.subject.trim() : '';
	if (!subject) errors.subject = 'Le sujet est obligatoire.';
	else if (!SUBJECTS.includes(subject as Subject)) errors.subject = 'Sujet invalide.';

	const message = isString(payload.message) ? payload.message.trim() : '';
	if (!message) errors.message = 'Le message est obligatoire.';
	else if (message.length < 10) errors.message = 'Le message doit comporter au moins 10 caractères.';
	else if (message.length > 5000) errors.message = 'Le message est trop long (max 5000 caractères).';

	if (payload.consent !== true) errors.consent = "Vous devez accepter que FTCI utilise vos informations pour vous contacter.";

	return errors;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
// Per-isolate state. Workers may spin up fresh isolates, so this is a soft cap
// rather than a distributed guarantee. For a low-volume contact form it is
// sufficient; switch to KV or Durable Objects if a hard limit becomes necessary.
const hits = new Map<string, { count: number; firstAt: number }>();

/** Returns `true` when `ip` has exceeded {@linkcode RATE_LIMIT_MAX} submissions in the rolling window. */
function rateLimited(ip: string): boolean {
	const now = Date.now();
	const entry = hits.get(ip);
	if (!entry || now - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
		hits.set(ip, { count: 1, firstAt: now });
		return false;
	}
	entry.count += 1;
	return entry.count > RATE_LIMIT_MAX;
}

interface KVNamespace {
	get(key: string, options?: { type?: 'json' | 'text' }): Promise<unknown>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * Returns the `MESSAGE_STORE` KV namespace bound in `wrangler.jsonc`, or `null`
 * when the binding is absent (local `astro dev` without `platformProxy`).
 *
 * Casts `env` to access the binding because the project does not currently
 * generate a typed `CloudflareEnv` interface; run `wrangler types` to replace
 * this with proper typing.
 */
function getMessageStore(): KVNamespace | null {
	try {
		const kv = (env as unknown as { MESSAGE_STORE?: KVNamespace }).MESSAGE_STORE;
		if (kv) return kv;
		console.log('[contact] MESSAGE_STORE not bound — using console.log fallback');
		return null;
	} catch (err) {
		console.error('[contact] Error accessing env.MESSAGE_STORE:', err);
		return null;
	}
}

/**
 * Persists `msg` to KV under `messages/YYYY/MM/<id>`, or logs it when no KV
 * binding is available. The date-prefixed key layout lets `wrangler kv key
 * list --prefix messages/2026/01/` enumerate a single day's submissions.
 */
async function persistMessage(msg: StoredMessage): Promise<void> {
	const kv = getMessageStore();

	if (kv) {
		const d = new Date(msg.receivedAt);
		const key = `messages/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${msg.id}`;
		await kv.put(key, JSON.stringify(msg), { expirationTtl: 60 * 60 * 24 * 365 });
		console.log(`[contact] Message stored in KV: ${key}`);
	} else {
		console.log('[contact] Message stored (dev mode — no KV):', JSON.stringify(msg, null, 2));
	}
}

/**
 * Contact form submission handler.
 *
 * @returns
 *   - `200` `{ ok: true, message }` on success, also returned to honeypot-flagged
 *     bots to avoid revealing that they were caught;
 *   - `400` `{ ok: false, error }` when the body is not valid JSON;
 *   - `422` `{ ok: false, errors: { field: message } }` per invalid field;
 *   - `429` `{ ok: false, error }` when the IP exceeds the rate limit;
 *   - `500` is left to the runtime for unhandled throws.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
	const ip = clientAddress || request.headers.get('x-forwarded-for') || null;

	if (ip && rateLimited(ip)) {
		return jsonResponse(429, {
			ok: false,
			error: 'Trop de tentatives. Veuillez réessayer dans une minute.',
		});
	}

	let payload: ContactPayload;
	try {
		payload = (await request.json()) as ContactPayload;
	} catch {
		return jsonResponse(400, { ok: false, error: 'Format de requête invalide (JSON attendu).' });
	}

	const errors = validate(payload);
	if (Object.keys(errors).length > 0) {
		// Honeypot triggered — pretend success so bots cannot probe the rule.
		if (errors._honeypot) {
			return jsonResponse(200, { ok: true, message: 'Message reçu avec succès.' });
		}
		return jsonResponse(422, { ok: false, errors });
	}

	const stored: StoredMessage = {
		id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		receivedAt: new Date().toISOString(),
		name: (payload.name as string).trim(),
		email: (payload.email as string).trim(),
		subject: payload.subject as Subject,
		message: (payload.message as string).trim(),
		ip,
		userAgent: request.headers.get('user-agent'),
	};

	console.log(`[contact] New message from ${stored.email} (${stored.subject})`);
	await persistMessage(stored);

	return jsonResponse(200, {
		ok: true,
		message: 'Message reçu avec succès. Nous vous recontacterons bientôt.',
	});
};

/** Rejects every non-POST method with `405 Method Not Allowed`. */
export const ALL: APIRoute = () =>
	new Response(JSON.stringify({ ok: false, error: 'Méthode non autorisée.' }), {
		status: 405,
		headers: { 'Content-Type': 'application/json', Allow: 'POST' },
	});

/** Builds a JSON `Response` with `no-store` caching, since every call is dynamic. */
function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
		},
	});
}
