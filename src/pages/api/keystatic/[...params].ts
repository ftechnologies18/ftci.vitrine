import type { APIRoute } from 'astro';
// eslint-disable-next-line import/no-unresolved
import config from 'virtual:keystatic-config';

export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
        return new Response(
                JSON.stringify({
                        ok: true,
                        msg: 'config imported successfully',
                        hasConfig: !!config,
                        storage: config?.storage?.kind,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
};
