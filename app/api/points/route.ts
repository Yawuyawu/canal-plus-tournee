import { Redis } from '@vercel/redis'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

let redis: any
try {
  redis = Redis.fromEnv()
} catch {}

export async function GET() {
  try {
    const points = await redis?.get('pdv')
    return NextResponse.json({ points: points ?? [] }, { status: 200 })
  } catch {
    return NextResponse.json({ points: [] }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const current = await redis?.get('pdv') ?? []
    const points = [...current, { ...body, id: Date.now() }]
    await redis?.set('pdv', points)
    return NextResponse.json({ success: true, points }, { status: 200 })
  } catch {
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
