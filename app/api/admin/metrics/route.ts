import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Cross-product admin hub feed. Read by the ChoreStar admin dashboard
 * (server to server) so one login shows KidCanvas growth too.
 * Protected by a shared secret in the x-hub-token header; anything else 404s
 * so the endpoint does not advertise itself.
 */
function authorized(req: NextRequest): boolean {
  const expected = process.env.HUB_METRICS_TOKEN ?? ''
  const given = req.headers.get('x-hub-token') ?? ''
  if (!expected || given.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

const DAY = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const admin = await createServiceClient()
    const d7 = new Date(Date.now() - 7 * DAY).toISOString()
    const d30 = new Date(Date.now() - 30 * DAY).toISOString()

    const count = async (table: 'families' | 'children' | 'artworks', column?: string, since?: string) => {
      let q = admin.from(table).select('*', { count: 'exact', head: true })
      if (column && since) q = q.gte(column, since)
      const { count: n, error } = await q
      if (error) throw new Error(`${table}: ${error.message}`)
      return n ?? 0
    }

    // Auth users, paginated (fine at current scale).
    const users: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null }[] = []
    for (let page = 1; ; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) throw new Error(`listUsers: ${error.message}`)
      users.push(...data.users)
      if (data.users.length < 1000) break
    }
    const since = (iso: string | null | undefined, floor: string) => !!iso && iso >= floor

    const [familiesTotal, familiesNew7, familiesNew30, childrenTotal, artTotal, artNew7, artNew30] = await Promise.all([
      count('families'), count('families', 'created_at', d7), count('families', 'created_at', d30),
      count('children'),
      count('artworks'), count('artworks', 'uploaded_at', d7), count('artworks', 'uploaded_at', d30),
    ])

    const { count: paid, error: paidErr } = await admin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing'])
      .neq('tier', 'free')
    if (paidErr) throw new Error(`subscriptions: ${paidErr.message}`)

    const recentSignups = [...users]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 10)
      .map((u) => ({ email: u.email ?? '', createdAt: u.created_at }))

    return NextResponse.json({
      product: 'kidcanvas',
      generatedAt: new Date().toISOString(),
      users: {
        total: users.length,
        new7: users.filter((u) => since(u.created_at, d7)).length,
        new30: users.filter((u) => since(u.created_at, d30)).length,
        active7: users.filter((u) => since(u.last_sign_in_at, d7)).length,
      },
      paid: { active: paid ?? 0 },
      families: { total: familiesTotal, new7: familiesNew7, new30: familiesNew30 },
      children: { total: childrenTotal },
      artworks: { total: artTotal, new7: artNew7, new30: artNew30 },
      recentSignups,
    })
  } catch (err) {
    console.error('admin/metrics failed:', err)
    // Only token holders reach this branch, so the message is safe to return.
    return NextResponse.json({ error: 'Metrics unavailable', detail: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
