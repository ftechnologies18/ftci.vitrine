/**
 * /api/keystatic/[...params] — Route API Keystatic (handler custom).
 *
 * Handler custom contournant le wrapper @keystatic/astro/api qui crash en
 * production sur Astro 7 + Cloudflare Workers. Appelle directement
 * makeGenericAPIRouteHandler depuis @keystatic/core/api/generic.
 */

import type { APIRoute } from 'astro';
// eslint-disable-next-line import/no-unresolved
import config from 'virtual:keystatic-config';

export const prerender = false;

async function getCfEnv(): Promise<Record<string, string> | undefined> {
        try {
                const mod = await import('cloudflare:workers');
                return mod.env as Record<string, string>;
        } catch {
                return undefined;
        }
}

export const ALL: APIRoute = async (context) => {
        try {
                // Dynamic imports pour éviter de crasher le module au top-level
                const { makeGenericAPIRouteHandler } = await import('@keystatic/core/api/generic');
                const { parseString } = await import('set-cookie-parser');

                const cfEnv = await getCfEnv();

                const handler = makeGenericAPIRouteHandler(
                        {
                                config,
                                clientId: cfEnv?.KEYSTATIC_GITHUB_CLIENT_ID,
                                clientSecret: cfEnv?.KEYSTATIC_GITHUB_CLIENT_SECRET,
                                secret: cfEnv?.KEYSTATIC_SECRET,
                        },
                        {
                                slugEnvName: 'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
                        },
                );

                const { body, headers, status } = await handler(context.request);

                // Reconstruction des headers
                const headerMap = new Map<string, string[]>();
                if (headers) {
                        if (Array.isArray(headers)) {
                                for (const [key, value] of headers) {
                                        const lower = key.toLowerCase();
                                        if (!headerMap.has(lower)) headerMap.set(lower, []);
                                        headerMap.get(lower)!.push(value);
                                }
                        } else if (typeof (headers as Headers).entries === 'function') {
                                for (const [key, value] of (headers as Headers).entries()) {
                                        headerMap.set(key.toLowerCase(), [value]);
                                }
                                if ('getSetCookie' in headers && typeof (headers as Headers).getSetCookie === 'function') {
                                        const setCookies = (headers as Headers).getSetCookie();
                                        if (setCookies?.length) {
                                                headerMap.set('set-cookie', setCookies);
                                        }
                                }
                        } else {
                                for (const [key, value] of Object.entries(headers as Record<string, string>)) {
                                        headerMap.set(key.toLowerCase(), [value]);
                                }
                        }
                }

                // Propagation des cookies via l'API Astro
                const setCookies = headerMap.get('set-cookie');
                headerMap.delete('set-cookie');
                if (setCookies) {
                        for (const cookieValue of setCookies) {
                                const { name, value, ...options } = parseString(cookieValue);
                                const sameSite = options.sameSite?.toLowerCase();
                                context.cookies.set(name, value, {
                                        domain: options.domain,
                                        expires: options.expires,
                                        httpOnly: options.httpOnly,
                                        maxAge: options.maxAge,
                                        path: options.path,
                                        sameSite:
                                                sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none'
                                                        ? sameSite
                                                        : undefined,
                                });
                        }
                }

                return new Response(body, {
                        status,
                        headers: [...headerMap.entries()].flatMap(([key, vals]) =>
                                vals.map((v) => [key, v]),
                        ),
                });
        } catch (err) {
                console.error('[keystatic-api] Error:', err);
                return new Response(
                        JSON.stringify({
                                ok: false,
                                error: err instanceof Error ? err.message : String(err),
                                stack: err instanceof Error ? err.stack?.split('\n').slice(0, 8).join('\n') : undefined,
                        }),
                        { status: 500, headers: { 'Content-Type': 'application/json' } },
                );
        }
};
