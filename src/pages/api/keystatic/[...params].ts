/**
 * /api/keystatic/[...params] — Route API Keystatic (handler custom).
 *
 * Handler custom contournant le wrapper @keystatic/astro/api qui crash en
 * production sur Astro 7 + Cloudflare Workers. Appelle directement
 * makeGenericAPIRouteHandler depuis @keystatic/core/api/generic.
 *
 * En mode Keystatic Cloud (storage.kind === 'cloud'), l'authentification
 * GitHub est gérée par api.keystatic.cloud — plus besoin de secrets OAuth
 * GitHub. Seul KEYSTATIC_SECRET reste nécessaire pour signer les cookies
 * de session locaux.
 */

import type { APIRoute } from 'astro';
import { parseString } from 'set-cookie-parser';
import config from 'virtual:keystatic-config';

export const prerender = false;

async function getCfEnv(): Promise<Record<string, string | undefined> | undefined> {
	try {
		const mod = await import('cloudflare:workers');
		return mod.env as unknown as Record<string, string | undefined>;
	} catch {
		return undefined;
	}
}

export const ALL: APIRoute = async (context) => {
	try {
		const { makeGenericAPIRouteHandler } = await import('@keystatic/core/api/generic');

		const cfEnv = await getCfEnv();

		// En mode cloud, clientId/clientSecret ne sont pas nécessaires —
		// Keystatic Cloud gère l'OAuth via son propre service.
		// On passe seulement KEYSTATIC_SECRET (toujours requis pour signer
		// les cookies de session locaux).
		const handler = makeGenericAPIRouteHandler({
			config,
			secret: cfEnv?.KEYSTATIC_SECRET,
		});

		const result = await handler(context.request);

		// Extraction des Set-Cookie et autres headers
		const responseHeaders = new Headers();
		const setCookies: string[] = [];

		if (result.headers) {
			if (result.headers instanceof Headers) {
				if ('getSetCookie' in result.headers && typeof result.headers.getSetCookie === 'function') {
					const sc = result.headers.getSetCookie();
					if (sc?.length) setCookies.push(...sc);
				}
				result.headers.forEach((value, key) => {
					if (key.toLowerCase() !== 'set-cookie') {
						responseHeaders.append(key, value);
					}
				});
			} else if (Array.isArray(result.headers)) {
				for (const [key, value] of result.headers) {
					if (key.toLowerCase() === 'set-cookie') {
						setCookies.push(value);
					} else {
						responseHeaders.append(key, value);
					}
				}
			}
		}

		// Pose les cookies via context.cookies.set() — l'adapter Cloudflare
		// strip les Set-Cookie des Response custom, donc context.cookies.set()
		// est la SEULE façon de poser un cookie qui arrive au navigateur.
		const isProd = import.meta.env.PROD;
		for (const cookieStr of setCookies) {
			try {
				const parsed = parseString(cookieStr);
				if (!parsed) continue;
				const { name, value, ...options } = parsed;
				const sameSite = options.sameSite?.toLowerCase();
				const resolvedSameSite =
					sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none'
						? (sameSite as 'lax' | 'strict' | 'none')
						: 'lax';
				context.cookies.set(name, value, {
					domain: options.domain,
					expires: options.expires,
					httpOnly: options.httpOnly ?? true, // forcer httpOnly par défaut
					maxAge: options.maxAge,
					path: options.path || '/',
					sameSite: resolvedSameSite,
					secure: isProd ? true : options.secure, // forcer Secure en prod
				});
			} catch (cookieErr) {
				console.error('[keystatic-api] Cookie parse error:', cookieErr);
			}
		}

		return new Response(result.body as BodyInit | null, {
			status: result.status,
			headers: responseHeaders,
		});
	} catch (err) {
		console.error('[keystatic-api] Error:', err);
		// En production, ne pas exposer les détails internes au client
		// (message d'erreur + stack trace = information disclosure).
		const isProd = import.meta.env.PROD;
		return new Response(
			JSON.stringify({
				ok: false,
				error: isProd
					? 'Erreur interne du serveur.'
					: err instanceof Error
						? err.message
						: String(err),
				...(isProd
					? {}
					: {
							stack:
								err instanceof Error ? err.stack?.split('\n').slice(0, 5).join('\n') : undefined,
						}),
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		);
	}
};
