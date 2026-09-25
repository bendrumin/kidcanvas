// Run with: node --test lib/push/payload.test.ts
// Node 23.6+ strips the types natively, so no test framework is needed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error: the explicit .ts extension is what lets plain `node` load
// this file; the Next build never compiles tests, so tsc's objection is moot.
import { buildPushPayload, pickRecipients } from './payload.ts'

const ART = '6f1c2f4e-2f53-4a53-9a39-4f0c1b7e9d10'

test('new artwork names the child and the title', () => {
  const p = buildPushPayload({ kind: 'artwork', artworkId: ART, childName: 'Emma', title: 'Rainbow dinosaur' })
  assert.equal(p.aps.alert.body, 'Emma added a new drawing: “Rainbow dinosaur”')
  assert.equal(p.artworkId, ART)
  assert.equal(p.aps['thread-id'], ART)
})

test('the untitled placeholder is not quoted back', () => {
  const p = buildPushPayload({ kind: 'artwork', artworkId: ART, childName: 'Emma', title: 'Untitled Artwork' })
  assert.equal(p.aps.alert.body, 'Emma added a new drawing')
})

test('comments put the text in the body and truncate long ones', () => {
  const p = buildPushPayload({ kind: 'comment', artworkId: ART, actorName: 'Grandma', title: 'Rainbow dinosaur', text: 'x'.repeat(300) })
  assert.equal(p.aps.alert.title, 'Grandma commented on “Rainbow dinosaur”')
  assert.ok(p.aps.alert.body.length <= 140)
})

test('reactions include the emoji', () => {
  const p = buildPushPayload({ kind: 'reaction', artworkId: ART, actorName: 'Grandma', title: 'Rainbow dinosaur', emoji: '❤️' })
  assert.equal(p.aps.alert.body, 'Grandma reacted ❤️ to “Rainbow dinosaur”')
})

test('no copy contains an em dash', () => {
  for (const e of [
    buildPushPayload({ kind: 'artwork', artworkId: ART, childName: null, title: '' }),
    buildPushPayload({ kind: 'comment', artworkId: ART, actorName: 'A', title: '', text: 'hi' }),
    buildPushPayload({ kind: 'reaction', artworkId: ART, actorName: 'A', title: '', emoji: '🎨' }),
  ]) {
    assert.ok(!JSON.stringify(e).includes(String.fromCharCode(0x2014)))
  }
})

const members = [
  { user_id: 'mom', role: 'owner' },
  { user_id: 'dad', role: 'parent' },
  { user_id: 'grandma', role: 'member' },
  { user_id: 'grandpa', role: 'viewer' },
]

test('new artwork goes to everyone but the uploader', () => {
  const r = pickRecipients({ kind: 'artwork', actorId: 'mom', uploaderId: 'mom', members, preferences: [] })
  assert.deepEqual(r.sort(), ['dad', 'grandma', 'grandpa'])
})

test('a comment goes to the uploader and parents, never the commenter', () => {
  const r = pickRecipients({ kind: 'comment', actorId: 'grandma', uploaderId: 'mom', members, preferences: [] })
  assert.deepEqual(r.sort(), ['dad', 'mom'])
})

test('a member who uploaded hears about reactions on their piece', () => {
  const r = pickRecipients({ kind: 'reaction', actorId: 'mom', uploaderId: 'grandma', members, preferences: [] })
  assert.deepEqual(r.sort(), ['dad', 'grandma'])
})

test('preferences switch each kind off independently', () => {
  const preferences = [
    { user_id: 'dad', new_artwork: false, comments_reactions: true },
    { user_id: 'mom', new_artwork: true, comments_reactions: false },
  ]
  assert.deepEqual(
    pickRecipients({ kind: 'artwork', actorId: 'mom', uploaderId: 'mom', members, preferences }).sort(),
    ['grandma', 'grandpa'],
  )
  assert.deepEqual(
    pickRecipients({ kind: 'comment', actorId: 'grandma', uploaderId: 'mom', members, preferences }),
    ['dad'],
  )
})
