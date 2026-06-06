import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

const KEY = 'canal-tournee'

export async function GET() {
  try {
    const data = await redis.get(KEY)
    return NextResponse.json({ 
      data: data ? JSON.parse(data) : [] 
    })
  } catch (e) {
    return NextResponse.json({ error: 'Redis GET failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await redis.set(KEY, JSON.stringify(body))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Redis SET failed' }, { status: 500 })
  }
}
