import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id } = req.body;
    let points = await kv.get('points') || [];
    points = points.map(p => p.id == id ? {...p, visited: true} : p);
    await kv.set('points', points);
    res.status(200).json({ success: true });
  }
}
