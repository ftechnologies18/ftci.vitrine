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

                console.log('[keystatic-api] cfEnv defined:', !!cfEnv);
                console.log('[keystatic-api] clientId set:', !!cfEnv?.KEYSTATIC_GITHUB_CLIENT_ID);
                console.log('[keystatic-api] clientSecret set:', !!cfEnv?.KEYSTATIC_GITHUB_CLIENT_SECRET);
                console.log('[keystatic-api] secret set:', !!cfEnv?.KEYSTATIC_SECRET);

                const handler = makeGenericAPIRouteHandler({
                        config,
                        clientId: cfEnv?.KEYSTATIC_GITHUB_CLIENT_ID,
                        clientSecret: cfEnv?.KEYSTATIC_GITHUB_CLIENT_SECRET,
                        secret: cfEnv?.KEYSTATIC_SECRET,
                });

                const result = await handler(context.request);

                // DEBUG : log tout ce que le handler retourne
                console.log('[keystatic-api] URL:', context.url.pathname);
                console.log('[keystatic-api] Status:', result.status);
                console.log('[keystatic-api] Headers type:', typeof result.headers);
                console.log('[keystatic-api] Is Array:', Array.isArray(result.headers));
                console.log('[keystatic-api] Is Headers:', result.headers instanceof Headers);
                console.log('[keystatic-api] JSON:', JSON.stringify(result.headers)?.substring(0, 500));

                // Reconstruction des headers en extrayant séparément les Set-Cookie
                const responseHeaders = new Headers();
                const setCookies: string[] = [];

                if (result.headers) {
                        if (result.headers instanceof Headers) {
                                if ('getSetCookie' in result.headers && typeof result.headers.getSetCookie === 'function') {
                                        const sc = result.headers.getSetCookie();
                                        console.log('[keystatic-api] getSetCookie() returned:', sc.length, 'cookies');
                                        if (sc?.length) setCookies.push(...sc);
                                }
                                result.headers.forEach((value, key) => {
                                        if (key.toLowerCase() === 'set-cookie') {
                                                setCookies.push(value);
                                        } else {
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

                console.log('[keystatic-api] Extracted setCookies:', setCookies.length);

                // Re-pose les cookies via l'API Astro native
                for (const cookieStr of setCookies) {
                        try {
                                const { name, value, ...options } = parseString(cookieStr);
                                console.log('[keystatic-api] Setting cookie:', name, 'value length:', value.length);
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
