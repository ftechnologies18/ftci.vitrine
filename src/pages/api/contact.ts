/**
 * FTCI Contact API endpoint
 *
 * POST /api/contact
 * Body (JSON): { name, email, subject, message, consent, website? }
 *  - website: honeypot field (must be empty)
 *
 * Responses:
 *  - 200 { ok: true, message }
 *  - 400 { ok: false, error } (malformed payload)
 *  - 422 { ok: false, errors: { field: msg } } (validation errors)
 *  - 429 { ok: false, error } (rate limited)
 *  - 500 { ok: false, error } (server error)
 *
 * STORAGE:
 *  - Production (Cloudflare Pages): utilise le KV namespace MESSAGE_STORE si bindé.
 *    Créez un KV namespace dans le dashboard Cloudflare et bindez-le comme "MESSAGE_STORE".
 *  - Dev (astro dev) : console.log uniquement (pas de KV en local sans wrangler).
 *
 * TODO PRODUCTION (optionnel):
 *  - Brancher un service d'envoi d'email (Resend, SendGrid, Mailgun) pour notifier l'équipe FTCI
 *  - Ou connecter à Cloudflare D1 pour stockage SQL queryable
 */

import type { APIRoute } from 'astro';
// Astro 7 + @astrojs/cloudflare: bindings access via 'cloudflare:workers' module
import { env } from 'cloudflare:workers';

export const prerender = false;

const SUBJECTS = ['consultation', 'demo', 'partnership', 'support', 'other'] as const;
type Subject = (typeof SUBJECTS)[number];

interface ContactPayload {
        name?: unknown;
        email?: unknown;
        subject?: unknown;
        message?: unknown;
        consent?: unknown;
        website?: unknown; // honeypot
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

// ---- Validation helpers ----------------------------------------------------

const isString = (v: unknown): v is string => typeof v === 'string';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(payload: ContactPayload): Record<string, string> {
        const errors: Record<string, string> = {};

        // Honeypot: must be empty
        if (isString(payload.website) && payload.website.trim() !== '') {
                errors._honeypot = 'spam detected';
                return errors;
        }

        // Name
        const name = isString(payload.name) ? payload.name.trim() : '';
        if (!name) errors.name = 'Le nom est obligatoire.';
        else if (name.length < 2) errors.name = 'Le nom doit comporter au moins 2 caractères.';
        else if (name.length > 100) errors.name = 'Le nom est trop long (max 100 caractères).';

        // Email
        const email = isString(payload.email) ? payload.email.trim() : '';
        if (!email) errors.email = "L'adresse email est obligatoire.";
        else if (!EMAIL_RE.test(email)) errors.email = "L'adresse email est invalide.";
        else if (email.length > 254) errors.email = "L'adresse email est trop longue.";

        // Subject
        const subject = isString(payload.subject) ? payload.subject.trim() : '';
        if (!subject) errors.subject = 'Le sujet est obligatoire.';
        else if (!SUBJECTS.includes(subject as Subject)) errors.subject = 'Sujet invalide.';

        // Message
        const message = isString(payload.message) ? payload.message.trim() : '';
        if (!message) errors.message = 'Le message est obligatoire.';
        else if (message.length < 10) errors.message = 'Le message doit comporter au moins 10 caractères.';
        else if (message.length > 5000) errors.message = 'Le message est trop long (max 5000 caractères).';

        // Consent
        if (payload.consent !== true) errors.consent = "Vous devez accepter que FTCI utilise vos informations pour vous contacter.";

        return errors;
}

// ---- Simple in-memory rate limiting (per IP, per worker isolate) ----------
// NOTE: This is per-isolate. For true distributed rate limiting on Cloudflare,
// use KV or Durable Objects. For a contact form (low volume), per-isolate is sufficient.

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 submissions / minute / IP
const hits = new Map<string, { count: number; firstAt: number }>();

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

// ---- Storage abstraction (Cloudflare KV via cloudflare:workers module) ----

interface KVNamespace {
        get(key: string, options?: { type?: 'json' | 'text' }): Promise<unknown>;
        put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * Récupère le KV namespace MESSAGE_STORE.
 * Astro 7: utilise `import { env } from 'cloudflare:workers'` (anciennement locals.runtime.env).
 * En dev (astro dev sans wrangler), env.MESSAGE_STORE est undefined → fallback console.log.
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

async function persistMessage(msg: StoredMessage): Promise<void> {
        const kv = getMessageStore();

        if (kv) {
                // Production: store in Cloudflare KV
                // Key: messages/YYYY/MM/msg_<id> — allows listing by date prefix
                const d = new Date(msg.receivedAt);
                const key = `messages/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${msg.id}`;
                await kv.put(key, JSON.stringify(msg), { expirationTtl: 60 * 60 * 24 * 365 }); // 1 year
                console.log(`[contact] Message stored in KV: ${key}`);
        } else {
                // Dev fallback: just log
                console.log('[contact] Message stored (dev mode — no KV):', JSON.stringify(msg, null, 2));
        }
}

// ---- Handler ---------------------------------------------------------------

export const POST: APIRoute = async ({ request, clientAddress }) => {
        const ip = clientAddress || request.headers.get('x-forwarded-for') || null;

        // Rate limit
        if (ip && rateLimited(ip)) {
                return jsonResponse(429, {
                        ok: false,
                        error: 'Trop de tentatives. Veuillez réessayer dans une minute.',
                });
        }

        // Parse body
        let payload: ContactPayload;
        try {
                payload = (await request.json()) as ContactPayload;
        } catch {
                return jsonResponse(400, { ok: false, error: 'Format de requête invalide (JSON attendu).' });
        }

        // Validate
        const errors = validate(payload);
        if (Object.keys(errors).length > 0) {
                // Honeypot triggered — pretend success to confuse bots
                if (errors._honeypot) {
                        return jsonResponse(200, { ok: true, message: 'Message reçu avec succès.' });
                }
                return jsonResponse(422, { ok: false, errors });
        }

        // Build stored message
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

        // Log + persist
        console.log(`[contact] New message from ${stored.email} (${stored.subject})`);
        await persistMessage(stored);

        // TODO (production): send email notification via Resend/SendGrid/Mailgun
        // using a separate API key stored as Cloudflare secret.

        return jsonResponse(200, {
                ok: true,
                message: 'Message reçu avec succès. Nous vous recontacterons bientôt.',
        });
};

// ---- Helpers ---------------------------------------------------------------

function jsonResponse(status: number, body: unknown): Response {
        return new Response(JSON.stringify(body), {
                status,
                headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Cache-Control': 'no-store',
                },
        });
}

// Reject non-POST methods
export const ALL: APIRoute = () =>
        new Response(JSON.stringify({ ok: false, error: 'Méthode non autorisée.' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json', Allow: 'POST' },
        });
