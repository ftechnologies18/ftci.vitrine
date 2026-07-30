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
                const { makeGenericAPIRouteHandler } = await import('@keystatic/core/api/generic');

                const cfEnv = await getCfEnv();

                const handler = makeGenericAPIRouteHandler({
                        config,
                        clientId: cfEnv?.KEYSTATIC_GITHUB_CLIENT_ID,
                        clientSecret: cfEnv?.KEYSTATIC_GITHUB_CLIENT_SECRET,
                        secret: cfEnv?.KEYSTATIC_SECRET,
                });

                const result = await handler(context.request);

                console.log('[keystatic-api] URL:', context.url.pathname, 'Status:', result.status);

                // Reconstruction complète des headers, en forwardant TOUT y compris Set-Cookie
                // directement dans la Response (sans context.cookies.set() qui ne marche pas
                // correctement avec l'adapter Cloudflare quand la response est retournée).
                const responseHeaders = new Headers();
                const setCookies: string[] = [];

                if (result.headers) {
                        if (result.headers instanceof Headers) {
                                // getSetCookie() est la seule façon fiable de récupérer
                                // plusieurs Set-Cookie depuis l'API Headers.
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

                // Forward direct des Set-Cookie dans les headers de la Response
                // (ne PAS utiliser context.cookies.set() — l'adapter Cloudflare
                // ne forward pas correctement les cookies posés via cette API
                // quand on retourne une Response custom)
                for (const cookieStr of setCookies) {
                        responseHeaders.append('Set-Cookie', cookieStr);
                        console.log('[keystatic-api] Forwarded Set-Cookie (first 80 chars):', cookieStr.substring(0, 80));
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
