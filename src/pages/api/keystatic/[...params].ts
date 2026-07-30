import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
// eslint-disable-next-line import/no-unresolved
import config from 'virtual:keystatic-config';

export const prerender = false;

// Lazy-init : makeHandler peut throw à l'initialisation si la config est
// incomplète (ex: secrets manquants en dev). On wrap pour éviter que le
// module entier fail et que la route soit marquée "not found" par le routeur.
let _handler: ReturnType<typeof makeHandler> | null = null;
function getHandler() {
        if (!_handler) {
                _handler = makeHandler({ config });
        }
        return _handler;
}

export const ALL: APIRoute = async (ctx) => {
        try {
                const handler = getHandler();
                return await handler(ctx);
        } catch (err) {
                console.error('[keystatic-api] Handler error:', err);
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
