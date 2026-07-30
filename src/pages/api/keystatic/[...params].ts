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

                const result = await handler(context.request);

                console.log('[keystatic-api] URL:', context.url.pathname + context.url.search);
                console.log('[keystatic-api] Status:', result.status);

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

                console.log('[keystatic-api] setCookies:', setCookies.length);

                // CRITICAL : utiliser context.cookies.set() pour poser les cookies.
                // L'adapter @astrojs/cloudflare STRIP les Set-Cookie headers des
                // Response custom retournées par les endpoints. La SEULE façon de
                // poser un cookie qui survive jusqu'au navigateur est d'utiliser
                // context.cookies.set() — l'adapter injecte ensuite ces cookies
                // dans la Response finale automatiquement.
                for (const cookieStr of setCookies) {
                        try {
                                const { name, value, ...options } = parseString(cookieStr);
                                console.log('[keystatic-api] context.cookies.set:', name, 'len:', value.length);
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
                                console.error('[keystatic-api] Cookie parse error:', cookieErr);
                        }
                }

                // NE PAS forwarder les Set-Cookie dans responseHeaders —
                // context.cookies.set() s'en charge, et les doubler ici ferait
                // que l'adapter Cloudflare les strippe (conflit).
                return new Response(result.body, {
                        status: result.status,
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
