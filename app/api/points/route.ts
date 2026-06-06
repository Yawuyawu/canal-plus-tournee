import { Redis } from 'redis'
import { NextResponse } from 'next/server'

const redis = new Redis(process.env.REDIS_URL!)

export async function GET() {
  try {
    const points = await redis.get('pdv')
    return NextResponse.json({ points: points ? JSON.parse(points) : [] })
  } catch (e) {
    return NextResponse.json({ error: 'Redis GET failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const current = await redis.get('pdv')
    const points = current ? JSON.parse(current) : []
    points.push(body)
    await redis.set('pdv', JSON.stringify(points))
    return NextResponse.json({ success: true, points })
  } catch (e) {
    return NextResponse.json({ error: 'Redis POST failed' }, { status: 500 })
  }
}
