/**
 * /api/keystatic/[...params] — Route API Keystatic (handler custom).
 *
 * Handler custom contournant le wrapper @keystatic/astro/api qui crash en
 * production sur Astro 7 + Cloudflare Workers. Appelle directement
 * makeGenericAPIRouteHandler depuis @keystatic/core/api/generic.
 *
 * IMPORTANT : Les cookies de session Set-Cookie retournés par le handler
 * générique doivent être extraits et re-posés via context.cookies.set()
 * (API Astro native). L'adapter Cloudflare ne forward pas correctement les
 * headers Set-Cookie bruts dans la Response — sans context.cookies.set(),
 * la session OAuth n'est jamais posée et l'UI affiche "Authorization failed".
 */

import type { APIRoute } from 'astro';
import { parseString } from 'set-cookie-parser';
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
                const { makeGenericAPIRouteHandler } = await import('@keystatic/core/api/generic');

                const cfEnv = await getCfEnv();

                const handler = makeGenericAPIRouteHandler({
                        config,
                        clientId: cfEnv?.KEYSTATIC_GITHUB_CLIENT_ID,
                        clientSecret: cfEnv?.KEYSTATIC_GITHUB_CLIENT_SECRET,
                        secret: cfEnv?.KEYSTATIC_SECRET,
                });

                const { body, headers, status } = await handler(context.request);

                // Reconstruction des headers en extrayant séparément les Set-Cookie
                const responseHeaders = new Headers();
                const setCookies: string[] = [];

                if (headers) {
                        if (headers instanceof Headers) {
                                // getSetCookie() est la seule façon fiable de récupérer
                                // plusieurs Set-Cookie depuis l'API Headers (forEach les dédoublerait).
                                if ('getSetCookie' in headers && typeof headers.getSetCookie === 'function') {
                                        const sc = headers.getSetCookie();
                                        if (sc?.length) setCookies.push(...sc);
                                }
                                headers.forEach((value, key) => {
                                        if (key.toLowerCase() !== 'set-cookie') {
                                                responseHeaders.append(key, value);
                                        }
                                });
                        } else if (Array.isArray(headers)) {
                                for (const [key, value] of headers) {
                                        if (key.toLowerCase() === 'set-cookie') {
                                                setCookies.push(value);
                                        } else {
                                                responseHeaders.append(key, value);
                                        }
                                }
                        } else if (typeof headers === 'object') {
                                for (const [key, value] of Object.entries(headers as Record<string, string>)) {
                                        if (key.toLowerCase() === 'set-cookie') {
                                                setCookies.push(value);
                                        } else {
                                                responseHeaders.append(key, value);
                                        }
                                }
                        }
                }

                // Re-pose les cookies via l'API Astro native — requis pour que
                // l'adapter Cloudflare les inclue réellement dans la response HTTP.
                for (const cookieStr of setCookies) {
                        try {
                                const { name, value, ...options } = parseString(cookieStr);
                                const sameSite = options.sameSite?.toLowerCase();
                                context.cookies.set(name, value, {
                                        domain: options.domain,
                                        expires: options.expires,
                                        httpOnly: options.httpOnly,
                                        maxAge: options.maxAge,
                                        path: options.path || '/',
                                        sameSite:
                                                sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none'
                                                        ? (sameSite as 'lax' | 'strict' | 'none')
                                                        : undefined,
                                        secure: options.secure,
                                });
                        } catch (cookieErr) {
                                console.error('[keystatic-api] Cookie parse error:', cookieErr, 'raw:', cookieStr);
                        }
                }

                return new Response(body, {
                        status,
                        headers: responseHeaders,
                });
        } catch (err) {
                console.error('[keystatic-api] Error:', err);
                return new Response(
                        JSON.stringify({
                                ok: false,
                                error: err instanceof Error ? err.message : String(err),
                                stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5).join('\n') : undefined,
                        }),
                        { status: 500, headers: { 'Content-Type': 'application/json' } },
                );
        }
};
