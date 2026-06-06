import { createClient } from 'redis'
import { NextResponse } from 'next/server'

const redis = createClient({ url: process.env.REDIS_URL })

// Fix pour Vercel : se connecter une seule fois
let redisConnected = false

export async function GET() {
  try {
    if (!redisConnected) {
      await redis.connect()
      redisConnected = true
    }
    const points = await redis.get('pdv')
    return NextResponse.json({ points: points ? JSON.parse(points) : [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Redis GET failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!redisConnected) {
      await redis.connect()
      redisConnected = true
    }
    const body = await request.json()
    const current = await redis.get('pdv')
    const points = current ? JSON.parse(current) : []
    points.push(body)
    await redis.set('pdv', JSON.stringify(points))
    return NextResponse.json({ success: true, points })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Redis POST failed' }, { status: 500 })
  }
}
