import { createClient } from 'redis'

export default async function handler(req, res) {
  const client = createClient({ url: process.env.REDIS_URL })
  
  try {
    await client.connect()
    
    if (req.method === 'GET') {
      const data = await client.get('pdv')
      await client.quit()
      return res.status(200).json({ data: data ? JSON.parse(data) : [] })
    }
    
    if (req.method === 'POST') {
      await client.set('pdv', JSON.stringify(req.body))
      await client.quit()
      return res.status(200).json({ ok: true })
    }
    
    await client.quit()
    res.status(405).end()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
