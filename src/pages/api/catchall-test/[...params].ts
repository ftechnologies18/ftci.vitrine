import type { APIRoute } from 'astro';

export const prerender = false;

export const ALL: APIRoute = ({ params }) => {
        return new Response(JSON.stringify({ ok: true, params: params.params }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
        });
};
