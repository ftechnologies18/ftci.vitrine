/**
 * /api/keystatic/[...params] — Route API Keystatic (handler custom).
 *
 * Contournement complet du wrapper @keystatic/astro/api qui crash en
 * production sur Astro 7 + Cloudflare Workers. On appelle directement
 * makeGenericAPIRouteHandler depuis @keystatic/core/api/generic (version
 * worker), en passant les secrets lus depuis cloudflare:workers.
 *
 * Les cookies de session set par Keystatic sont propagés via
 * context.cookies.set() (API Astro native).
 */

import type { APIRoute } from 'astro';
import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import { parseString } from 'set-cookie-parser';
// eslint-disable-next-line import/no-unresolved
import config from 'virtual:keystatic-config';

export const prerender = false;

/**
 * Résout l'env Cloudflare au runtime via dynamic import.
 * L'import statique `import { env } from 'cloudflare:workers'` casserait le
 * build Vite car ce module n'existe qu'au runtime Workers, pas pendant le
 * prerender/build.
 */
async function getCfEnv(): Promise<Record<string, string> | undefined> {
        try {
                const mod = await import('cloudflare:workers');
                return mod.env as Record<string, string>;
        } catch {
                return undefined;
        }
}

export const ALL: APIRoute = async (context) => {
        // Lecture des secrets depuis l'env Cloudflare (résolu au runtime)
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

        // Reconstruction des headers (notamment set-cookie)
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
                headers: [...headerMap.entries()].flatMap(([key, vals]) => vals.map((v) => [key, v])),
        });
};
