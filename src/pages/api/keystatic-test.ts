import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () => {
        return new Response(JSON.stringify({ ok: true, message: 'route de test OK' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
        });
};
