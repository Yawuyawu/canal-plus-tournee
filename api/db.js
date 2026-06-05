import { kv } from '@vercel/kv';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    if (req.method === 'GET') {
      const pdvs = await kv.get('pdvs');
      return new Response(JSON.stringify({ data: pdvs || [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const { data } = await req.json();
      await kv.set('pdvs', data);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method Not Allowed', { status: 405 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
