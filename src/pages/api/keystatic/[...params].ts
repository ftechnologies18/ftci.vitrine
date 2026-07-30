import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
// eslint-disable-next-line import/no-unresolved
import config from 'virtual:keystatic-config';

export const prerender = false;

const handler = makeHandler({ config });

export const ALL: APIRoute = async (ctx) => {
        try {
                const result = await handler(ctx);
                return result;
        } catch (err) {
                console.error('[keystatic-api] Handler error:', err);
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
