import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
// eslint-disable-next-line import/no-unresolved
import config from 'virtual:keystatic-config';

export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
        return new Response(
                JSON.stringify({
                        ok: true,
                        msg: 'both imports OK',
                        hasConfig: !!config,
                        hasHandler: typeof makeHandler,
                        storage: config?.storage?.kind,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
};
