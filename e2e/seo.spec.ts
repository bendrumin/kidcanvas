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
const PAGES = ['/', '/support', '/privacy', '/terms', '/login', '/signup']

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
  expect(types).toContain('SoftwareApplication')
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
