import { Redis } from '@upstash/redis'
const redis = Redis.fromEnv()
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await redis.get('pdv') || []
      return res.status(200).json({ data })
    }
    if (req.method === 'POST') {
      const body = req.body
      await redis.set('pdv', body)
      return res.status(200).json({ ok: true })
    }
    res.status(405).end()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
