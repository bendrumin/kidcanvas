// Builds the APNs payload for a family event. Kept pure (no imports, no I/O) so
// the copy can be checked in isolation: `node --test lib/push/payload.test.ts`.

export type FamilyPushEvent =
  | { kind: 'artwork'; artworkId: string; childName: string | null; title: string }
  | { kind: 'comment'; artworkId: string; actorName: string; title: string; text: string }
  | { kind: 'reaction'; artworkId: string; actorName: string; title: string; emoji: string }

export type ApnsPayload = {
  aps: {
    alert: { title?: string; body: string }
    sound: 'default'
    'thread-id': string
  }
  // Read by the iOS app to open the artwork when the notification is tapped.
  artworkId: string
  kind: FamilyPushEvent['kind']
}

// Both clients save an untitled piece under this placeholder; quoting it back
// ("added a new drawing: 'Untitled Artwork'") reads like a bug.
const PLACEHOLDER_TITLES = new Set(['', 'untitled artwork', 'untitled'])

// A lock screen shows roughly two lines. Cutting here keeps a long comment from
// being clipped mid-word by the system with no ellipsis.
const MAX_COMMENT_CHARS = 140

export function displayTitle(title: string | null | undefined): string | null {
  const trimmed = (title ?? '').trim()
  return PLACEHOLDER_TITLES.has(trimmed.toLowerCase()) ? null : trimmed
}

function quoted(title: string): string {
  return `“${title}”`
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).trimEnd() + '…'
}

export function buildPushPayload(event: FamilyPushEvent): ApnsPayload {
  const title = displayTitle(event.title)
  let alert: ApnsPayload['aps']['alert']

  switch (event.kind) {
    case 'artwork': {
      const who = event.childName?.trim() || 'Your family'
      alert = {
        body: title ? `${who} added a new drawing: ${quoted(title)}` : `${who} added a new drawing`,
      }
      break
    }
    case 'comment': {
      const what = title ? quoted(title) : 'a drawing'
      alert = {
        title: `${event.actorName} commented on ${what}`,
        body: truncate(event.text, MAX_COMMENT_CHARS),
      }
      break
    }
    case 'reaction': {
      const what = title ? quoted(title) : 'a drawing'
      alert = { body: `${event.actorName} reacted ${event.emoji} to ${what}` }
      break
    }
  }

  return {
    aps: {
      alert,
      sound: 'default',
      // Groups every notification about one drawing into a single stack.
      'thread-id': event.artworkId,
    },
    artworkId: event.artworkId,
    kind: event.kind,
  }
}

export type FamilyMemberRow = { user_id: string; role: string }
export type PreferenceRow = { user_id: string; new_artwork: boolean; comments_reactions: boolean }

// Who hears about an event. The actor never does: nobody wants a push about
// their own comment. New artwork goes to the whole family. Comments and
// reactions go to whoever uploaded the piece plus the other owners and parents,
// since a co-parent cares that Grandma loved it even if they did not scan it,
// while fanning every reaction out to every grandparent would be noise.
export function pickRecipients(args: {
  kind: FamilyPushEvent['kind']
  actorId: string | null
  uploaderId: string | null
  members: FamilyMemberRow[]
  preferences: PreferenceRow[]
}): string[] {
  const { kind, actorId, uploaderId, members, preferences } = args
  const prefs = new Map(preferences.map((p) => [p.user_id, p]))

  const candidates = members.filter((m) => {
    if (kind === 'artwork') return true
    return m.user_id === uploaderId || m.role === 'owner' || m.role === 'parent'
  })

  const recipients = new Set<string>()
  for (const m of candidates) {
    if (m.user_id === actorId) continue
    // No row means the defaults, which are on.
    const p = prefs.get(m.user_id)
    if (p && kind === 'artwork' && !p.new_artwork) continue
    if (p && kind !== 'artwork' && !p.comments_reactions) continue
    recipients.add(m.user_id)
  }
  return Array.from(recipients)
}
