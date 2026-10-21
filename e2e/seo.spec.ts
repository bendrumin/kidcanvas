import { test, expect } from '@playwright/test'

/**
 * The SEO surface, pinned. Everything here was broken at least once:
 * - every page's canonical pointed at the homepage, telling Google that
 *   /support, /privacy and /signup were duplicates of / -- self-deindexing
 * - titles rendered "Support | KidCanvas | KidCanvas" (page + template both
 *   appending the brand)
 * - the JSON-LD was injected client-side in a useEffect, so crawlers fetching
 *   the HTML saw none of it -- and what it would have injected included a
 *   fabricated 5-star aggregateRating and a logo URL that 404ed
 */
const PAGES = ['/', '/support', '/privacy', '/terms', '/login', '/signup', '/delete-account']

for (const path of PAGES) {
  test(`${path} has its own canonical`, async ({ page }) => {
    await page.goto(path)
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href')
    // Canonicals resolve against metadataBase, so they are production URLs
    // even when the test runs against localhost -- which is correct: the
    // canonical names the one true URL of the page, not wherever it happens
    // to be served from.
    const expected =
      path === '/'
        ? ['https://kidcanvas.app', 'https://kidcanvas.app/']
        : [`https://kidcanvas.app${path}`]
    expect(expected, `${path} canonical is ${canonical}`).toContain(canonical)
  })

  test(`${path} title carries the brand exactly once`, async ({ page }) => {
    await page.goto(path)
    const title = await page.title()
    const count = (title.match(/KidCanvas/g) ?? []).length
    expect(count, `title is "${title}"`).toBe(1)
  })
}

test('structured data is in the server HTML, and honest', async ({ request }) => {
  const html = await (await request.get('/')).text()
  const blocks = [...html.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs
  )].map((m) => JSON.parse(m[1]))

  const types = blocks.map((b) => b['@type'])
  expect(types).toContain('Organization')
  // MobileApplication since the iOS app shipped; SoftwareApplication was the
  // pre-launch type. Either one makes the "this is an app" claim to Google.
  expect(
    types.some((t) => t === 'MobileApplication' || t === 'SoftwareApplication'),
    `no app schema type, got ${types.join(', ')}`
  ).toBe(true)
  expect(types).toContain('WebSite')

  // No invented reviews, ever. Google issues manual actions for this.
  expect(html).not.toContain('aggregateRating')
})

test('the Organization logo actually resolves', async ({ request }) => {
  const response = await request.get('/logo.png')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('image/png')
})

test('robots.txt allows the public site and shields the private one', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('Allow: /')
  expect(robots).toContain('Disallow: /dashboard/')
  expect(robots).toContain('Disallow: /api/')
  expect(robots).toContain('Sitemap: https://kidcanvas.app/sitemap.xml')
})

test('the sitemap lists every public page', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  for (const path of PAGES) {
    expect(xml).toContain(`<loc>https://kidcanvas.app${path === '/' ? '' : path}</loc>`)
  }
})

test('the homepage links somewhere you can actually get the app', async ({ request }) => {
  // This pinned the TestFlight beta link. 1.0 is on the App Store now, so the
  // invariant is that some download path exists, not which one it is.
  const html = await (await request.get('/')).text()
  const appStore = (html.match(/apps\.apple\.com/g) ?? []).length
  const testFlight = (html.match(/testflight\.apple\.com/g) ?? []).length
  expect(appStore + testFlight, 'no App Store or TestFlight link on the homepage').toBeGreaterThanOrEqual(1)
})

test('every public page serves the Google Analytics tag', async ({ request, baseURL }) => {
  // The GA component renders in production builds only (so dev servers and
  // this very test suite never pollute the numbers), which means this can only
  // be asserted against the deployed site:
  //   PLAYWRIGHT_BASE_URL=https://kidcanvas.app npx playwright test e2e/seo.spec.ts
  test.skip(!baseURL?.includes('kidcanvas.app'), 'production-only behaviour')
  for (const path of PAGES) {
    const html = await (await request.get(path)).text()
    expect(html, `${path} is missing the GA tag`).toContain('googletagmanager.com/gtag/js?id=G-DCH53W5VJT')
  }
})

for (const path of PAGES) {
  test(`${path} has the on-page basics search engines look for`, async ({ page }) => {
    await page.goto(path)

    // One h1, always. /login and /signup had none for months because their
    // heading came from CardTitle, which renders an h3.
    expect(await page.locator('h1').count(), `${path} needs exactly one h1`).toBe(1)

    // Google truncates around 160 characters of description and 60 of title.
    // The homepage description sat at 175 and was getting cut mid-sentence.
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description, `${path} has no meta description`).toBeTruthy()
    expect(description!.length, `${path} description is ${description!.length} chars`).toBeGreaterThanOrEqual(50)
    expect(description!.length, `${path} description is ${description!.length} chars`).toBeLessThanOrEqual(160)

    expect((await page.title()).length, `${path} title too long`).toBeLessThanOrEqual(60)
  })
}

test('share links and invites tell search engines to stay away', async ({ request }) => {
  // A share link carries a child's artwork, first name and story. It is
  // unlisted, not private, so one posted anywhere public could be indexed.
  // The header applies to every URL under the path, so a made-up code is a
  // fair probe and no real data is needed.
  for (const path of ['/share/not-a-real-code', '/invite/not-a-real-code']) {
    const response = await request.get(path)
    const header = response.headers()['x-robots-tag'] ?? ''
    expect(header, `${path} is indexable`).toContain('noindex')
    expect(header, `${path} can be cached by search engines`).toContain('noarchive')
  }

  // And these paths must NOT be disallowed in robots.txt: a blocked URL can
  // still be indexed by address alone, and the crawler would never see the
  // noindex above.
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).not.toMatch(/Disallow:\s*\/(share|invite)/)
})
