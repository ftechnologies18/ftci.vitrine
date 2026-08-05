/**
 * /api/newsletter/subscribe — Endpoint d'abonnement newsletter FTCI.
 *
 * Reçoit un email, le valide, et l'ajoute à l'audience Resend configurée
 * via le secret `RESEND_AUDIENCE_ID` (bindé sur le Worker Cloudflare).
 *
 * Pipeline :
 *   1. Rate limiting (5 abonnements / 5 min / IP via KV)
 *   2. CSRF : vérification Origin/Referer
 *   3. Validation email (regex + length)
 *   4. Appel API Resend POST /contacts avec audience_id
 *   5. Gestion des cas : succès (201), déjà abonné (422), invalide (422)
 *
 * Secrets Cloudflare requis :
 *   - RESEND_API_KEY        — clé API Resend (déjà bindée pour le form contact)
 *   - RESEND_AUDIENCE_ID    — ID de l'audience newsletter (à binder)
 *
 * Documentation API Resend Contacts :
 *   https://resend.com/docs/api-reference/contacts/create-contact
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/** Force on-demand rendering. */
export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 300; // 5 minutes

const ALLOWED_ORIGINS = [
	'https://ftci.fr',
	'https://www.ftci.fr',
	'https://ftci-vitrine.freelancetechnologies-ci.workers.dev',
];

function isOriginAllowed(request: Request): boolean {
	if (import.meta.env.DEV) return true;
	const origin = request.headers.get('origin') || request.headers.get('referer') || '';
	if (!origin) return false;
	return ALLOWED_ORIGINS.some((a) => origin.startsWith(a));
}

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
		},
	});
}

/**
 * Verifies a Cloudflare Turnstile token via the canonical siteverify endpoint.
 * Returns true if the token is valid, false otherwise.
 */
async function verifyTurnstile(token: string, clientIp: string | null): Promise<boolean> {
	const secret = env.TURNSTILE_SECRET;
	// Soft fail: if no secret is configured, skip Turnstile verification (dev mode)
	if (!secret) {
		console.warn('[turnstile] TURNSTILE_SECRET not set — skipping verification');
		return true;
	}
	try {
		const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				secret,
				response: token,
				remoteip: clientIp ?? '',
			}),
		});
		if (!res.ok) return false;
		const data = (await res.json()) as { success: boolean };
		return data.success === true;
	} catch (err) {
		console.error('[turnstile] siteverify error:', err);
		return false;
	}
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
	// 1. CSRF : vérifier l'origine
	if (!isOriginAllowed(request)) {
		return jsonResponse(403, { ok: false, error: 'Origine non autorisée.' });
	}

	const ip = request.headers.get('cf-connecting-ip') || clientAddress || null;

	// 2. Rate limiting via KV
	const kv = env.MESSAGE_STORE;
	if (kv && ip) {
		const rateKey = `ratelimit_nl/${ip}`;
		try {
			const raw = await kv.get(rateKey);
			const count = raw ? parseInt(raw, 10) : 0;
			if (count >= RATE_LIMIT_MAX) {
				return jsonResponse(429, {
					ok: false,
					error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
				});
			}
			await kv.put(rateKey, String(count + 1), {
				expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
			});
		} catch {
			// KV indisponible → on continue sans rate limit (soft fail)
		}
	}

	// 3. Parse body + Turnstile verification
	let body: { email?: unknown; 'cf-turnstile-response'?: unknown };
	try {
		body = (await request.json()) as { email?: unknown; 'cf-turnstile-response'?: unknown };
	} catch {
		return jsonResponse(400, { ok: false, error: 'Format de requête invalide.' });
	}

	const turnstileToken = typeof body['cf-turnstile-response'] === 'string'
		? (body['cf-turnstile-response'] as string)
		: undefined;

	if (!turnstileToken || !(await verifyTurnstile(turnstileToken, ip))) {
		return jsonResponse(403, { ok: false, error: 'Vérification de sécurité échouée. Veuillez réessayer.' });
	}

	// 4. Valider l'email
	const email = typeof body.email === 'string' ? body.email.trim() : '';

	if (!email) {
		return jsonResponse(422, { ok: false, error: "L'adresse email est obligatoire." });
	}
	if (email.length > 254) {
		return jsonResponse(422, { ok: false, error: "L'adresse email est trop longue." });
	}
	if (!EMAIL_RE.test(email)) {
		return jsonResponse(422, { ok: false, error: 'Adresse email invalide.' });
	}

	// 4. Récupérer les secrets Resend
	const apiKey = env.RESEND_API_KEY;
	const audienceId = env.RESEND_AUDIENCE_ID;

	if (!apiKey || !audienceId) {
		console.error('[newsletter] Missing RESEND_API_KEY or RESEND_AUDIENCE_ID');
		return jsonResponse(503, {
			ok: false,
			error: 'Service newsletter temporairement indisponible.',
		});
	}

	// 5. Appel API Resend POST /contacts
	try {
		const res = await fetch('https://api.resend.com/contacts', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email,
				audience_id: audienceId,
				unsubscribed: false,
			}),
		});

		// 201 = succès, contact créé
		if (res.status === 201) {
			console.log('[newsletter] New subscriber added (email hidden)');
			return jsonResponse(200, {
				ok: true,
				message: 'Abonnement réussi ! Vous recevrez nos prochains articles directement par email.',
			});
		}

		// 422 = déjà abonné ou email rejeté par Resend
		if (res.status === 422) {
			const body = (await res.json().catch(() => ({}))) as { message?: string };
			if (body.message?.toLowerCase().includes('already')) {
				return jsonResponse(200, {
					ok: true,
					message: 'Vous êtes déjà abonné à la newsletter FTCI. Merci !',
				});
			}
			return jsonResponse(422, {
				ok: false,
				error: 'Adresse email rejetée par le service. Vérifiez votre saisie.',
			});
		}

		// Autre erreur Resend
		const body = await res.text().catch(() => '<no body>');
		console.error(`[newsletter] Resend API error (${res.status}):`, body);
		return jsonResponse(502, {
			ok: false,
			error: "Erreur lors de l'abonnement. Veuillez réessayer plus tard.",
		});
	} catch (err) {
		console.error('[newsletter] Network error:', err);
		return jsonResponse(502, {
			ok: false,
			error: 'Erreur réseau. Veuillez réessayer plus tard.',
		});
	}
};

/** Rejects every non-POST method. */
export const ALL: APIRoute = () =>
	new Response(JSON.stringify({ ok: false, error: 'Méthode non autorisée.' }), {
		status: 405,
		headers: { 'Content-Type': 'application/json', Allow: 'POST' },
	});
