/**
 * Reseeds the App Review demo family's gallery.
 *
 * The demo account is handed to Apple's Beta App Review and App Review with
 * working delete buttons, so its artwork disappears from time to time (build
 * 17's review deleted two of three pieces). Run this after any review to
 * restore the set. Idempotent: skips any artwork whose title already exists.
 *
 * Uses the anon key and signs in AS the demo user, so everything it does is
 * exactly what the app itself is allowed to do under RLS.
 *
 *   node scripts/reseed-demo.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright-core'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const EMAIL = process.env.DEMO_EMAIL || 'kidcanvas.appreview@gmail.com'
const PASSWORD = process.env.DEMO_PASSWORD || 'ReviewDemo!2026'

const SEEDS = [
  {
    title: 'Rainbow and Butterfly',
    artist: 'Eli',
    created_date: '2026-07-02',
    story:
      'He said the butterfly is flying home over the rainbow before it rains, and the rainbow is holding the sky up so it does not fall on her.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
      <rect width="800" height="1000" fill="#FDF6EC"/>
      <g transform="translate(400,330)">
        <ellipse cx="-95" cy="0" rx="85" ry="70" fill="#F48FB1"/>
        <ellipse cx="95" cy="0" rx="85" ry="70" fill="#F48FB1"/>
        <ellipse cx="0" cy="10" rx="32" ry="95" fill="#9C6ADE"/>
        <line x1="-12" y1="-85" x2="-42" y2="-150" stroke="#B0A8A0" stroke-width="9" stroke-linecap="round"/>
        <line x1="12" y1="-85" x2="42" y2="-150" stroke="#B0A8A0" stroke-width="9" stroke-linecap="round"/>
      </g>
      ${['#E53935','#FB8C00','#FDD835','#66BB6A','#42A5F5','#9575CD']
        .map((c, i) => `<path d="M 90 850 A ${310 - i * 42} ${310 - i * 42} 0 0 1 710 850" fill="none" stroke="${c}" stroke-width="40" stroke-linecap="round" transform="translate(0,${-i * 0})"/>`)
        .join('')}
    </svg>`,
  },
  {
    title: 'Carpet Spaceship',
    artist: 'Maya',
    created_date: '2026-08-09',
    story:
      'She lined up every cushion on the carpet and said this is the spaceship, and the red one is the button you are not allowed to press.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
      <rect width="800" height="1000" fill="#FDF6EC"/>
      <rect x="80" y="620" width="640" height="280" rx="24" fill="#8D6E63"/>
      <rect x="110" y="650" width="580" height="220" rx="16" fill="#A1887F"/>
      <g>
        <rect x="150" y="680" width="130" height="90" rx="18" fill="#42A5F5"/>
        <rect x="320" y="680" width="130" height="90" rx="18" fill="#66BB6A"/>
        <rect x="490" y="680" width="130" height="90" rx="18" fill="#FDD835"/>
        <circle cx="400" cy="830" r="34" fill="#E53935"/>
      </g>
      <path d="M 400 140 L 520 480 L 280 480 Z" fill="#9575CD"/>
      <circle cx="400" cy="380" r="46" fill="#B3E5FC" stroke="#5E35B1" stroke-width="10"/>
      <path d="M 340 480 L 400 590 L 460 480 Z" fill="#FB8C00"/>
    </svg>`,
  },
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
})
if (authError) throw authError
console.log(`  signed in as ${EMAIL}`)

const { data: member } = await supabase
  .from('family_members').select('family_id').eq('user_id', auth.user.id).single()
const familyId = member.family_id
const { data: children } = await supabase
  .from('children').select('id, name').eq('family_id', familyId)
const { data: existing } = await supabase
  .from('artworks').select('title').eq('family_id', familyId)
const have = new Set((existing ?? []).map((a) => a.title))

const browser = await chromium.launch()
const page = await browser.newPage()

for (const seed of SEEDS) {
  if (have.has(seed.title)) { console.log(`  skip (exists): ${seed.title}`); continue }
  const child = children.find((c) => c.name === seed.artist)
  if (!child) { console.log(`  skip (no artist ${seed.artist}): ${seed.title}`); continue }

  const shots = {}
  for (const [suffix, width, height] of [['', 800, 1000], ['_thumb', 320, 400]]) {
    await page.setViewportSize({ width, height })
    await page.setContent(`<body style="margin:0">${seed.svg.replace('viewBox', `width="${width}" height="${height}" viewBox`)}</body>`)
    shots[suffix] = await page.screenshot({ type: 'jpeg', quality: 88 })
  }

  const artworkId = randomUUID()
  const urls = {}
  for (const [suffix, buffer] of Object.entries(shots)) {
    const path = `${familyId}/${artworkId}${suffix}.jpg`
    const { error } = await supabase.storage.from('artworks')
      .upload(path, buffer, { contentType: 'image/jpeg' })
    if (error) throw new Error(`upload ${path}: ${error.message}`)
    urls[suffix] = supabase.storage.from('artworks').getPublicUrl(path).data.publicUrl
  }

  const { error } = await supabase.from('artworks').insert({
    id: artworkId,
    family_id: familyId,
    child_id: child.id,
    image_url: urls[''],
    thumbnail_url: urls['_thumb'],
    title: seed.title,
    story: seed.story,
    created_date: seed.created_date,
    uploaded_by: auth.user.id,
  })
  if (error) throw new Error(`insert ${seed.title}: ${error.message}`)
  console.log(`  seeded: ${seed.title} (by ${seed.artist})`)
}

await browser.close()
console.log('  done')
