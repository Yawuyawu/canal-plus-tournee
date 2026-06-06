import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

export async function GET() {
  try {
    const points = await redis.get('pdv')
    return NextResponse.json({ points: points ?? [] })
  } catch {
    return NextResponse.json({ points: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const current = await redis.get('pdv') ?? []
    const points = [...current, { ...body, id: Date.now() }]
    await redis.set('pdv', points)
    return NextResponse.json({ success: true, points })
  } catch {
    return NextResponse.json({ success: false })
  }
}
