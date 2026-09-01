import { test, expect } from '@playwright/test'

/**
 * A regression guard, not a style check.
 *
 * The marketing copy repeatedly advertised features that had been deleted from
 * the product: AI auto-tagging after the AI route was removed, voice notes after
 * the recorder was deleted, moment photos that no upload path ever wrote, a data
 * export that was never built, and a "5.0 from early users" star rating on a
 * product with no users. Each was true once, or never, and nothing failed when
 * it stopped being true.
 *
 * If any of these strings comes back, that is the bug.
 */
const BANNED = [
  // features that do not exist
  'AI auto-tagging',
  'AI tagging',
  'AI Description',
  'auto-tagged',
  'Auto-tags',
  'voice note',
  'Video moment capture',
  'moment photo',
  'Moment Photos',
  'white-label',
  'API access',
  'watermark',
  // capabilities we never built
  'Export all your data',
  'Export anytime',
  'Download everything',
  // a rating with no ratings behind it
  '5.0 from early users',
  'Trusted by families',
  // dropped product line
  'For Teachers',
  'art teacher',
  'classroom',
  // stories are not required; the web upload form has no story field
  'no story, no upload',
  'Story capture (REQUIRED)',
  'requires a story',
  'minimum 20 characters',
  // the free tier is 50, and we have no crowd to invite people to join
  'unlimited artworks free',
  'Join families already',
  '(guaranteed)',
  // the profile entity is an "artist" on every platform; "child" is for real kids
  'child profile',
  'Add Child',
  // art books are Family-plan; the every-feature version of the claim was the lie
  'Every feature is included',
]

const PUBLIC_PAGES = ['/', '/support', '/privacy', '/terms', '/login', '/signup']

for (const path of PUBLIC_PAGES) {
  test(`${path} does not advertise anything that was removed`, async ({ page }) => {
    await page.goto(path)
    const text = (await page.locator('body').innerText()).toLowerCase()

    const found = BANNED.filter((phrase) => text.includes(phrase.toLowerCase()))
    expect(
      found,
      `${path} mentions features that do not exist: ${found.join(', ')}`
    ).toEqual([])
  })
}

test('the landing page still says the true things', async ({ page }) => {
  await page.goto('/')
  const text = await page.locator('body').innerText()

  // The product's actual proposition, and the actual free limit.
  expect(text).toContain('Remember what they said')
  expect(text).toMatch(/50 artworks/)
})

test('pricing shows the same numbers the code charges', async ({ page }) => {
  await page.goto('/')
  const text = await page.locator('body').innerText()

  // These must match PRICES in lib/stripe.ts. The page said $49/year while the
  // code charged 49.99 -- a real mismatch a customer would have noticed.
  expect(text).toContain('$4.99')
  expect(text).toContain('$49.99')
})

test('fonts are self-hosted, not fetched from Google', async ({ page }) => {
  // globals.css used to @import Fredoka and Nunito from fonts.googleapis.com,
  // which the Content-Security-Policy blocked -- so every page in production
  // silently rendered in system-ui and nothing failed. next/font self-hosts them
  // now. Asserting the request behaviour rather than computed style, because
  // WebKit normalises font-family to "-webkit-standard" and cannot be compared.
  const external: string[] = []
  const localFonts: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) external.push(url)
    if (/\.(woff2?|ttf)(\?|$)/.test(url)) localFonts.push(url)
  })

  await page.goto('/')
  await page.waitForLoadState('load')

  expect(external, 'font request went out to Google').toEqual([])
  expect(localFonts.length, 'no self-hosted font was requested').toBeGreaterThan(0)
})

test('public copy has no em dashes and no emoji-as-labels', async ({ page }) => {
  // From the unslop-text dataset: the em dash is the single most-cited tell
  // that text was machine-written, and emoji standing in for bullets or
  // headings is close behind. Both had crept into the copy (many by our own
  // hand) and were rewritten as ordinary sentences. Keep them out.
  for (const path of PUBLIC_PAGES) {
    await page.goto(path)
    const text = await page.locator('main, body').first().innerText()
    expect(text.includes('\u2014'), `${path} contains an em dash`).toBe(false)
    const emojiLabel = text.match(/^\s*[\u{1F300}-\u{1FAFF}\u2600-\u27BF][\uFE0F]?\s+[A-Z]/mu)
    expect(emojiLabel, `${path} has an emoji-prefixed label: ${emojiLabel?.[0]}`).toBeNull()
  }
})

test('buttons speak with one voice', async ({ page }) => {
  // The nav said "Log in" while the page it opened said "Sign In" and iOS says
  // Sign In / Sign Up / Sign Out. The homepage also had six differently-worded
  // buttons for the same action. Keep the verb consistent and the labels calm:
  // no "Log in", and no button shouting with an exclamation mark.
  for (const path of PUBLIC_PAGES) {
    await page.goto(path)
    const labels = await page.locator('button, a[role="button"], a.button').allInnerTexts()
    const flat = labels.map((l) => l.trim()).filter(Boolean)
    expect(flat.filter((l) => /^log ?in$/i.test(l)), `${path} still says Log in`).toEqual([])
    expect(flat.filter((l) => l.endsWith('!')), `${path} has a shouting button`).toEqual([])
  }
})
