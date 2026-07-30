import type { APIRoute } from 'astro';

export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
        return new Response(
                JSON.stringify({
                        ok: true,
                        msg: 'route matched, no keystatic import',
                        url: ctx.url.pathname,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
};
