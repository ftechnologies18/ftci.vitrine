import type { APIRoute } from 'astro';
// eslint-disable-next-line import/no-unresolved
import config from 'virtual:keystatic-config';

export const prerender = false;

export const ALL: APIRoute = async (context) => {
        try {
                // Dynamic imports pour éviter le crash module au top-level
                const { makeGenericAPIRouteHandler } = await import('@keystatic/core/api/generic');

                // Lecture des secrets Cloudflare au runtime
                let cfEnv: Record<string, string> | undefined;
                try {
                        const mod = await import('cloudflare:workers');
                        cfEnv = mod.env as Record<string, string>;
                } catch {
                        // dev mode sans platformProxy
                }

                const handler = makeGenericAPIRouteHandler({
                        config,
                        clientId: cfEnv?.KEYSTATIC_GITHUB_CLIENT_ID,
                        clientSecret: cfEnv?.KEYSTATIC_GITHUB_CLIENT_SECRET,
                        secret: cfEnv?.KEYSTATIC_SECRET,
                });

                const result = await handler(context.request);

                // Forward simple des headers set-cookie si présents
                const responseHeaders = new Headers();
                if (result.headers) {
                        if (result.headers instanceof Headers) {
                                result.headers.forEach((value, key) => {
                                        responseHeaders.append(key, value);
                                });
                        } else if (Array.isArray(result.headers)) {
                                for (const [key, value] of result.headers) {
                                        responseHeaders.append(key, value);
                                }
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
                        }),
                        { status: 500, headers: { 'Content-Type': 'application/json' } },
                );
        }
};
