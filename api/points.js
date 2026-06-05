import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const points = await kv.get('points') || [];
    res.status(200).json(points);
  }
}
