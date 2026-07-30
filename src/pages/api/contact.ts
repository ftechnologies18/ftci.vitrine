/**
 * Contact form endpoint for the FTCI vitrine site.
 *
 * Receives POST submissions from the home page {@linkcode /src/components/Contact.astro}
 * form, validates them, persists accepted messages to the Cloudflare KV
 * namespace bound as `MESSAGE_STORE`, and dispatches async notifications to the
 * FTCI team (Resend email + Discord webhook) and to the visitor (confirmation
 * email). Runs on-demand on the Cloudflare Workers runtime (see
 * {@linkcode prerender}); it must not depend on Node.js built-ins because the
 * Workers V8 isolate does not provide them.
 *
 * Pipeline:
 *   1. IP-based rate limiting (per worker isolate, see {@linkcode rateLimited}).
 *   2. JSON body parsing.
 *   3. Field validation, including a honeypot field that silently reports
 *      success to suspected bots.
 *   4. Persistence to KV with a `messages/YYYY/MM/<id>` key layout for
 *      date-prefix listings. KV remains the source of truth.
 *   5. Async notifications (non-blocking, fault-tolerant via Promise.allSettled):
 *      a. Email to the FTCI team via Resend (reply-to: visitor address).
 *      b. Confirmation email to the visitor via Resend.
 *      c. Discord webhook notification (real-time team alert).
 *      Each notification is independent: if one fails (or its secret is
 *      missing), the others still run and the visitor still sees success.
 *      Failures are logged via `console` so they show up in `wrangler tail`.
 *
 * Bindings (wrangler.jsonc): declare `MESSAGE_STORE` under `kv_namespaces`.
 *
 * Secrets (set via `wrangler secret put` or the Cloudflare dashboard):
 *   - `RESEND_API_KEY`     Resend API key (https://resend.com/api-keys)
 *   - `DISCORD_WEBHOOK_URL` Discord channel webhook URL
 *
 * Local dev fallback: when KV is unbound, messages are logged to the console.
 * Notification helpers also log instead of calling external APIs when their
 * secret is missing, so `pnpm run dev` keeps working without credentials.
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/** Force on-demand rendering. Static prerendering would freeze the route at build time. */
export const prerender = false;

const SUBJECTS = ['consultation', 'demo', 'partnership', 'support', 'other'] as const;
type Subject = (typeof SUBJECTS)[number];

/** Human-readable labels for each {@linkcode Subject}, used in emails & Discord. */
const SUBJECT_LABELS: Record<Subject, string> = {
        consultation: 'Consultation',
        demo: 'Demande de démo',
        partnership: 'Partenariat',
        support: 'Support technique',
        other: 'Autre',
};

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

/**
 * Returns the `MESSAGE_STORE` KV namespace bound in `wrangler.jsonc`, or `null`
 * when the binding is absent (local `astro dev` without `platformProxy`).
 *
 * The `Env` interface (with `MESSAGE_STORE?: KVNamespace`) is declared in
 * `src/env.d.ts`. Regenerate `worker-configuration.d.ts` via `wrangler types`
 * after changing `wrangler.jsonc` bindings if you rely on the generated types.
 */
function getMessageStore(): KVNamespace | null {
        try {
                const kv = env.MESSAGE_STORE;
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

// ─── Notification layer ───────────────────────────────────────────────────────
//
// Three independent dispatchers (team email, visitor email, Discord) each take
// the stored message and fire-and-forget. They never throw to the caller: any
// failure is caught and logged so `wrangler tail` surfaces it without breaking
// the visitor-facing response.
//
// Secrets are read from `env` (Cloudflare Workers secret bindings). Missing
// secrets are not an error — the dispatcher simply logs a notice and resolves,
// so the rest of the pipeline keeps working while you finish provisioning.

/** FTCI brand colors used in email + Discord styling. */
const BRAND = {
        navy: '#0F1E3D',
        orange: '#EE6C1A',
        periwinkle: '#6B7FC7',
        green: '#1E9E4F',
        bgLight: '#F2F4F8',
        textMuted: '#6B7280',
} as const;

/** Sender identity used for every outbound email. The domain must be verified in Resend. */
const EMAIL_FROM = 'FTCI Contact <contact@ftci.fr>';
/** Recipient for team notifications. */
const TEAM_EMAIL_TO = 'contact@ftci.fr';
/** Per-provider timeout so a slow provider can never stall the response. */
const NOTIFY_TIMEOUT_MS = 8_000;

/**
 * Sends the team notification email via Resend, with the visitor's address as
 * `reply-to` so the team can answer directly from their mailbox.
 *
 * @returns `true` on success, `false` on any failure (logged but not thrown).
 */
async function sendTeamEmail(msg: StoredMessage): Promise<boolean> {
        const apiKey = env.RESEND_API_KEY;
        if (!apiKey) {
                console.warn('[contact] RESEND_API_KEY not set — skipping team email');
                return false;
        }

        const subject = `[FTCI Vitrine] ${SUBJECT_LABELS[msg.subject]} — ${msg.name}`;
        const html = renderTeamEmailHtml(msg);

        try {
                const res = await fetchWithTimeout(
                        'https://api.resend.com/emails',
                        {
                                method: 'POST',
                                headers: {
                                        Authorization: `Bearer ${apiKey}`,
                                        'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                        from: EMAIL_FROM,
                                        to: [TEAM_EMAIL_TO],
                                        reply_to: msg.email,
                                        subject,
                                        html,
                                }),
                        },
                        NOTIFY_TIMEOUT_MS,
                );

                if (!res.ok) {
                        const body = await res.text().catch(() => '<no body>');
                        console.error(`[contact] Resend team email failed (${res.status}):`, body);
                        return false;
                }
                console.log('[contact] Team email sent via Resend');
                return true;
        } catch (err) {
                console.error('[contact] Resend team email error:', err);
                return false;
        }
}

/**
 * Sends a confirmation email to the visitor, acknowledging receipt of their
 * message and recalling its content for their records.
 *
 * @returns `true` on success, `false` on any failure (logged but not thrown).
 */
async function sendVisitorEmail(msg: StoredMessage): Promise<boolean> {
        const apiKey = env.RESEND_API_KEY;
        if (!apiKey) {
                // Already warned by sendTeamEmail; no need to repeat.
                return false;
        }

        const subject = 'Confirmation de réception de votre message — FTCI';
        const html = renderVisitorEmailHtml(msg);

        try {
                const res = await fetchWithTimeout(
                        'https://api.resend.com/emails',
                        {
                                method: 'POST',
                                headers: {
                                        Authorization: `Bearer ${apiKey}`,
                                        'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                        from: EMAIL_FROM,
                                        to: [msg.email],
                                        subject,
                                        html,
                                }),
                        },
                        NOTIFY_TIMEOUT_MS,
                );

                if (!res.ok) {
                        const body = await res.text().catch(() => '<no body>');
                        console.error(`[contact] Resend visitor email failed (${res.status}):`, body);
                        return false;
                }
                console.log(`[contact] Confirmation email sent to ${msg.email}`);
                return true;
        } catch (err) {
                console.error('[contact] Resend visitor email error:', err);
                return false;
        }
}

/**
 * Posts a rich embed notification to the configured Discord channel webhook.
 * The embed uses the FTCI orange accent and surfaces the visitor's details so
 * the team can triage in real time without leaving their chat tool.
 *
 * @returns `true` on success, `false` on any failure (logged but not thrown).
 */
async function sendDiscordNotification(msg: StoredMessage): Promise<boolean> {
        const webhookUrl = env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) {
                console.warn('[contact] DISCORD_WEBHOOK_URL not set — skipping Discord notification');
                return false;
        }

        const subjectLabel = SUBJECT_LABELS[msg.subject];
        // Discord embed field values must be non-empty strings.
        const safeMessage = msg.message.length > 1024 ? msg.message.slice(0, 1021) + '…' : msg.message;
        const safeIp = msg.ip ?? 'Inconnue';

        const payload = {
                username: 'FTCI Vitrine',
                embeds: [
                        {
                                title: ` Nouveau message — ${subjectLabel}`,
                                color: 0xee6c1a, // FTCI orange as a decimal int.
                                fields: [
                                        { name: 'Nom', value: msg.name, inline: true },
                                        { name: 'Email', value: msg.email, inline: true },
                                        { name: 'Sujet', value: subjectLabel, inline: true },
                                        { name: 'Adresse IP', value: safeIp, inline: true },
                                        { name: 'Message', value: safeMessage },
                                ],
                                footer: { text: "FTCI — Freelance Technologies Côte d'Ivoire" },
                                timestamp: msg.receivedAt,
                        },
                ],
        };

        try {
                const res = await fetchWithTimeout(
                        webhookUrl,
                        {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                        },
                        NOTIFY_TIMEOUT_MS,
                );

                if (!res.ok) {
                        const body = await res.text().catch(() => '<no body>');
                        console.error(`[contact] Discord webhook failed (${res.status}):`, body);
                        return false;
                }
                console.log('[contact] Discord notification sent');
                return true;
        } catch (err) {
                console.error('[contact] Discord webhook error:', err);
                return false;
        }
}

/**
 * Dispatches all three notifications in parallel and waits for every outcome
 * via `Promise.allSettled`. Returns a short summary useful for logging.
 *
 * Failures do NOT propagate: each dispatcher already catches its own errors,
 * and `allSettled` adds a second safety net.
 */
async function dispatchNotifications(msg: StoredMessage): Promise<void> {
        const results = await Promise.allSettled([
                sendTeamEmail(msg),
                sendVisitorEmail(msg),
                sendDiscordNotification(msg),
        ]);

        const labels = ['team email', 'visitor email', 'discord'] as const;
        results.forEach((r, i) => {
                if (r.status === 'rejected') {
                        console.error(`[contact] ${labels[i]} dispatcher rejected:`, r.reason);
                }
        });
}

/**
 * Wraps `fetch` with an AbortController-based timeout so a slow provider can
 * never stall the request. Workers support `AbortController` natively.
 */
async function fetchWithTimeout(
        url: string,
        init: RequestInit,
        timeoutMs: number,
): Promise<Response> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
                return await fetch(url, { ...init, signal: controller.signal });
        } finally {
                clearTimeout(timer);
        }
}

// ─── Email HTML templates ─────────────────────────────────────────────────────
//
// Inline CSS only — most email clients (Gmail, Outlook) strip <style> tags.
// Keep markup table-based for Outlook compatibility; brand colors from BRAND.

/** Escapes HTML special characters in user input before injecting into email markup. */
function escapeHtml(s: string): string {
        return s
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
}

/** Formats an ISO date string as a readable French date (e.g. "15 janvier 2026 à 14:32 UTC"). */
function formatFrenchDate(iso: string): string {
        const d = new Date(iso);
        const mois = [
                'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
        ];
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${d.getUTCDate()} ${mois[d.getUTCMonth()]} ${d.getUTCFullYear()} à ${hh}:${mm} UTC`;
}

/**
 * Renders the FTCI team notification email. Includes every field needed to
 * triage and reply: name, email (reply-to), subject, message, date, IP, UA.
 */
function renderTeamEmailHtml(msg: StoredMessage): string {
        const eName = escapeHtml(msg.name);
        const eEmail = escapeHtml(msg.email);
        const eSubject = escapeHtml(SUBJECT_LABELS[msg.subject]);
        const eMessage = escapeHtml(msg.message);
        const eDate = escapeHtml(formatFrenchDate(msg.receivedAt));
        const eIp = escapeHtml(msg.ip ?? 'Inconnue');
        const eUa = escapeHtml(msg.userAgent ?? 'Inconnu');

        return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bgLight};font-family:Inter,Arial,sans-serif;color:${BRAND.navy};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BRAND.bgLight};padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${BRAND.navy};padding:24px 32px;">
            <div style="font-family:Poppins,Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">
              FTCI <span style="color:${BRAND.orange};">·</span> <span style="font-weight:600;color:#ffffff;opacity:0.85;">Nouveau message</span>
            </div>
            <div style="margin-top:4px;font-size:13px;color:#ffffff;opacity:0.7;">Freelance Technologies Côte d'Ivoire</div>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Un visiteur a envoyé un message via le formulaire de contact du site vitrine.</p>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;">
            <tr><td style="padding:8px 0;color:${BRAND.textMuted};width:120px;vertical-align:top;">Nom</td><td style="padding:8px 0;font-weight:600;">${eName}</td></tr>
            <tr><td style="padding:8px 0;color:${BRAND.textMuted};vertical-align:top;">Email</td><td style="padding:8px 0;"><a href="mailto:${eEmail}" style="color:${BRAND.orange};text-decoration:none;font-weight:600;">${eEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:${BRAND.textMuted};vertical-align:top;">Sujet</td><td style="padding:8px 0;font-weight:600;">${eSubject}</td></tr>
            <tr><td style="padding:8px 0;color:${BRAND.textMuted};vertical-align:top;">Date</td><td style="padding:8px 0;">${eDate}</td></tr>
            <tr><td style="padding:8px 0;color:${BRAND.textMuted};vertical-align:top;">Adresse IP</td><td style="padding:8px 0;font-family:monospace;font-size:13px;">${eIp}</td></tr>
            <tr><td style="padding:8px 0;color:${BRAND.textMuted};vertical-align:top;">User-Agent</td><td style="padding:8px 0;font-family:monospace;font-size:12px;word-break:break-all;">${eUa}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:13px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.05em;">Message</p>
          <div style="padding:16px;background:${BRAND.bgLight};border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${eMessage}</div>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;">
          <a href="mailto:${eEmail}?subject=Re%3A%20${encodeURIComponent(SUBJECT_LABELS[msg.subject])}" style="display:inline-block;background:${BRAND.orange};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:14px;">Répondre au visiteur</a>
        </td></tr>
        <tr><td style="padding:16px 32px;background:${BRAND.bgLight};font-size:12px;color:${BRAND.textMuted};text-align:center;">
          Message ID : <code style="font-family:monospace;">${escapeHtml(msg.id)}</code>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Renders the visitor confirmation email. Reassures them that the message was
 * received, sets the 48-business-hour expectation, and recalls their message
 * so they have a copy in their mailbox.
 */
function renderVisitorEmailHtml(msg: StoredMessage): string {
        const eName = escapeHtml(msg.name);
        const eSubject = escapeHtml(SUBJECT_LABELS[msg.subject]);
        const eMessage = escapeHtml(msg.message);
        const eDate = escapeHtml(formatFrenchDate(msg.receivedAt));

        return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bgLight};font-family:Inter,Arial,sans-serif;color:${BRAND.navy};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BRAND.bgLight};padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${BRAND.navy};padding:24px 32px;">
            <div style="font-family:Poppins,Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">
              FTCI <span style="color:${BRAND.orange};">·</span> <span style="font-weight:600;color:#ffffff;opacity:0.85;">Confirmation</span>
            </div>
            <div style="margin-top:4px;font-size:13px;color:#ffffff;opacity:0.7;">Freelance Technologies Côte d'Ivoire</div>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-family:Poppins,Arial,sans-serif;font-size:22px;font-weight:700;color:${BRAND.navy};">Bonjour ${eName},</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Nous avons bien reçu votre message et nous vous remercions de l'intérêt que vous portez à FTCI. Notre équipe vous recontactera sous <strong style="color:${BRAND.orange};">48 heures ouvrées</strong> au plus tard.</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Pour rappel, voici un récapitulatif de votre demande :</p>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;">
            <tr><td style="padding:8px 0;color:${BRAND.textMuted};width:120px;vertical-align:top;">Sujet</td><td style="padding:8px 0;font-weight:600;">${eSubject}</td></tr>
            <tr><td style="padding:8px 0;color:${BRAND.textMuted};vertical-align:top;">Date de réception</td><td style="padding:8px 0;">${eDate}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
          <p style="margin:0 0 8px;font-size:13px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.05em;">Votre message</p>
          <div style="padding:16px;background:${BRAND.bgLight};border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${eMessage}</div>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:14px;line-height:1.6;">Une question urgente ? Vous pouvez nous joindre directement :</p>
          <p style="margin:8px 0 0;font-size:14px;">
            <a href="mailto:contact@ftci.fr" style="color:${BRAND.orange};text-decoration:none;font-weight:600;">contact@ftci.fr</a>
            &nbsp;·&nbsp;
            <a href="tel:+2250566184040" style="color:${BRAND.orange};text-decoration:none;font-weight:600;">+225 05 6618 4040</a>
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:${BRAND.bgLight};font-size:12px;color:${BRAND.textMuted};line-height:1.5;text-align:center;">
          Ceci est un email automatique envoyé depuis le formulaire de contact du site ftci.fr.<br>
          Merci de ne pas y répondre directement — utilisez plutôt les coordonnées ci-dessus.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
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

        // 1. Persist to KV first — this is the source of truth and must succeed
        //    before we tell the visitor "message received".
        await persistMessage(stored);

        // 2. Dispatch notifications. On Cloudflare Workers we use `ctx.waitUntil`
        //    so the runtime keeps the isolate alive after the response is sent,
        //    letting Resend/Discord complete in the background without making
        //    the visitor wait. In local dev (no runtime context) we fall back
        //    to a plain await so notifications still fire before the request
        //    ends — providers each have their own 8s timeout, so the worst-case
        //    wait is bounded and the form's "Envoi…" spinner covers it.
        //
        //    API note: @astrojs/cloudflare v4 (Astro v6+) exposes the Workers
        //    ExecutionContext at `locals.cfContext`. The older `locals.runtime.ctx`
        //    path was removed and now throws. We check cfContext first and keep
        //    the legacy path as a fallback for older adapter versions.
        const localsAny = locals as {
                cfContext?: { waitUntil?: (p: Promise<unknown>) => void };
                runtime?: { ctx?: { waitUntil?: (p: Promise<unknown>) => void } };
        } | undefined;
        const waitUntil = localsAny?.cfContext?.waitUntil ?? localsAny?.runtime?.ctx?.waitUntil;

        if (waitUntil) {
                waitUntil(dispatchNotifications(stored));
        } else {
                await dispatchNotifications(stored);
        }

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
