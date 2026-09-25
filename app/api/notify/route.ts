import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { buildPushPayload, pickRecipients, type FamilyPushEvent } from '@/lib/push/payload'
import { isDeadToken, readApnsConfig, sendToDevices, type ApnsEnvironment } from '@/lib/push/apns'

// Fans a family event out as push notifications.
//
// Only the database calls this: migration 012 puts an AFTER INSERT trigger on
// artworks, artwork_comments, and artwork_reactions that posts {table, id}
// here with a shared secret. No app ever calls it, so no client can pick who
// gets notified. The body is treated as a hint and nothing more: the row is
// re-read with the service role, and the family, the actor, and the recipients
// all come from the database, never from the request.

const TABLES = ['artworks', 'artwork_comments', 'artwork_reactions'] as const
type EventTable = (typeof TABLES)[number]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function authorized(request: NextRequest): boolean {
  const secret = process.env.PUSH_NOTIFY_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const presented = header.startsWith('Bearer ') ? header.slice(7) : ''
  const a = Buffer.from(presented)
  const b = Buffer.from(secret)
  // Constant-time so the secret cannot be guessed a byte at a time.
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

type Service = Awaited<ReturnType<typeof createServiceClient>>

type ResolvedEvent = {
  event: FamilyPushEvent
  familyId: string
  actorId: string | null
  uploaderId: string | null
}

async function actorName(supabase: Service, familyId: string, userId: string): Promise<string> {
  // The nickname is what the family chose to call this person ("Grandma"),
  // which beats whatever they typed as their legal name at sign-up.
  const { data: member } = await supabase
    .from('family_members')
    .select('nickname')
    .eq('family_id', familyId)
    .eq('user_id', userId)
    .maybeSingle()
  if (member?.nickname?.trim()) return member.nickname.trim()

  const { data } = await supabase.auth.admin.getUserById(userId)
  const fullName = (data.user?.user_metadata?.full_name as string | undefined)?.trim()
  if (fullName) return fullName.split(/\s+/)[0]
  return 'Someone in your family'
}

async function resolveEvent(supabase: Service, table: EventTable, id: string): Promise<ResolvedEvent | null> {
  if (table === 'artworks') {
    const { data: artwork } = await supabase
      .from('artworks')
      .select('id, family_id, title, uploaded_by, children(name)')
      .eq('id', id)
      .maybeSingle()
    if (!artwork) return null
    const child = artwork.children as { name: string } | { name: string }[] | null
    const childName = Array.isArray(child) ? child[0]?.name ?? null : child?.name ?? null
    return {
      event: { kind: 'artwork', artworkId: artwork.id, childName, title: artwork.title },
      familyId: artwork.family_id,
      actorId: artwork.uploaded_by,
      uploaderId: artwork.uploaded_by,
    }
  }

  const source =
    table === 'artwork_comments'
      ? await supabase.from('artwork_comments').select('artwork_id, user_id, text').eq('id', id).maybeSingle()
      : await supabase
          .from('artwork_reactions')
          .select('artwork_id, user_id, emoji_type, created_at')
          .eq('id', id)
          .maybeSingle()
  const row = source.data as {
    artwork_id: string
    user_id: string
    text?: string
    emoji_type?: string
    created_at?: string | null
  } | null
  if (!row) return null

  const { data: artwork } = await supabase
    .from('artworks')
    .select('id, family_id, title, uploaded_by')
    .eq('id', row.artwork_id)
    .maybeSingle()
  if (!artwork) return null

  if (table === 'artwork_reactions') {
    // Someone tapping three emoji in a row is one moment, not three. Only
    // their earliest surviving reaction on a piece announces anything.
    // Comparing against this row's timestamp, rather than counting, means two
    // near-simultaneous taps still produce exactly one push instead of none.
    if (row.created_at) {
      const { count } = await supabase
        .from('artwork_reactions')
        .select('id', { count: 'exact', head: true })
        .eq('artwork_id', row.artwork_id)
        .eq('user_id', row.user_id)
        .lt('created_at', row.created_at)
      if ((count ?? 0) > 0) return null
    }
  }

  const name = await actorName(supabase, artwork.family_id, row.user_id)
  const event: FamilyPushEvent =
    table === 'artwork_comments'
      ? { kind: 'comment', artworkId: artwork.id, actorName: name, title: artwork.title, text: row.text ?? '' }
      : { kind: 'reaction', artworkId: artwork.id, actorName: name, title: artwork.title, emoji: row.emoji_type ?? '' }

  return { event, familyId: artwork.family_id, actorId: row.user_id, uploaderId: artwork.uploaded_by }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { table?: unknown; id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const table = body.table as EventTable
  const id = body.id
  if (!TABLES.includes(table) || typeof id !== 'string' || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
  }

  const config = readApnsConfig()
  if (!config) {
    // Deliberately a 200: the database does not retry, and a missing key is an
    // owner setup step, not something a retry would fix.
    console.warn('[notify] APNs env vars are not set; skipping push')
    return NextResponse.json({ sent: 0, skipped: 'apns_not_configured' })
  }

  const supabase = await createServiceClient()
  const resolved = await resolveEvent(supabase, table, id)
  if (!resolved) return NextResponse.json({ sent: 0 })

  const { data: members } = await supabase
    .from('family_members')
    .select('user_id, role')
    .eq('family_id', resolved.familyId)
  const memberRows = members ?? []

  // RLS already stops outsiders from commenting, but this route runs as the
  // service role, so it checks again rather than trust that no future policy
  // loosens it.
  if (resolved.actorId && !memberRows.some((m) => m.user_id === resolved.actorId)) {
    return NextResponse.json({ sent: 0 })
  }

  const candidateIds = memberRows.map((m) => m.user_id)
  const { data: preferences } = candidateIds.length
    ? await supabase
        .from('notification_preferences')
        .select('user_id, new_artwork, comments_reactions')
        .in('user_id', candidateIds)
    : { data: [] }

  const recipients = pickRecipients({
    kind: resolved.event.kind,
    actorId: resolved.actorId,
    uploaderId: resolved.uploaderId,
    members: memberRows,
    preferences: preferences ?? [],
  })
  if (recipients.length === 0) return NextResponse.json({ sent: 0 })

  const { data: devices } = await supabase
    .from('push_devices')
    .select('token, environment')
    .in('user_id', recipients)
  if (!devices?.length) return NextResponse.json({ sent: 0 })

  const payload = buildPushPayload(resolved.event)
  const byEnv = new Map<ApnsEnvironment, string[]>()
  for (const d of devices) {
    const env: ApnsEnvironment = d.environment === 'sandbox' ? 'sandbox' : 'production'
    byEnv.set(env, [...(byEnv.get(env) ?? []), d.token])
  }

  const results = (
    await Promise.all(
      Array.from(byEnv.entries()).map(([env, tokens]) => sendToDevices(config, env, tokens, payload)),
    )
  ).flat()

  const dead = results.filter(isDeadToken).map((r) => r.token)
  if (dead.length) {
    await supabase.from('push_devices').delete().in('token', dead)
  }

  const failures = results.filter((r) => r.status !== 200 && !isDeadToken(r))
  if (failures.length) {
    // Tokens are not logged: they identify a device.
    console.error('[notify] APNs failures:', failures.map((f) => `${f.status} ${f.reason ?? ''}`.trim()))
  }

  return NextResponse.json({
    sent: results.filter((r) => r.status === 200).length,
    removed: dead.length,
    failed: failures.length,
  })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
