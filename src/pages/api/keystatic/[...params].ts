import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';

export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
        return new Response(
                JSON.stringify({
                        ok: true,
                        msg: 'makeHandler imported successfully',
                        hasHandler: typeof makeHandler,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
};
