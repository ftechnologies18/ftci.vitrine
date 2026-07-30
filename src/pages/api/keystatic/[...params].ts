import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
// eslint-disable-next-line import/no-unresolved
import config from 'virtual:keystatic-config';

export const prerender = false;

const handler = makeHandler({ config });

export const ALL: APIRoute = async (ctx) => {
        return new Response(
                JSON.stringify({
                        ok: true,
                        msg: 'makeHandler called successfully',
                        hasHandler: typeof handler,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
};
