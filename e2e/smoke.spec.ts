import { test, expect } from '@playwright/test'

const PUBLIC_PAGES = ['/', '/support', '/privacy', '/terms', '/login', '/signup']

for (const path of PUBLIC_PAGES) {
  test(`${path} loads without console or page errors`, async ({ page }) => {
    const problems: string[] = []
    // Resource-fetch failures are ignored here on purpose: WebKit in a sandbox
    // reports TLS failures that Chromium never sees, and a genuinely missing
    // asset is already caught by the status assertion and the broken-image test.
    // Uncaught JS is what this test is for, and that stays strict.
    const NOISE = /Failed to load resource|TLS error|net::ERR_/
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !NOISE.test(msg.text())) {
        problems.push(`console: ${msg.text()}`)
      }
    })
    page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`))

    const response = await page.goto(path)
    expect(response?.status(), `${path} status`).toBe(200)
    // not networkidle: the dev server holds an HMR websocket open forever
    await page.waitForLoadState('load')

    expect(problems, `${path} produced errors`).toEqual([])
  })
}

test('signed-out visitors are sent to login from the dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/)
})

test('no image renders broken', async ({ page }) => {
  await page.goto('/')
  // not networkidle: the dev server holds an HMR websocket open forever
  await page.waitForLoadState('load')

  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src)
  )
  expect(broken, 'images failed to load').toEqual([])
})

test('every link on the landing page has a destination', async ({ page }) => {
  await page.goto('/')
  const empty = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a'))
      .filter((a) => {
        const href = a.getAttribute('href')
        return !href || href === '#' || href === ''
      })
      .map((a) => a.textContent?.trim().slice(0, 40) ?? '(no text)')
  )
  expect(empty, 'links with no destination').toEqual([])
})

test('the hero renders words with spaces between them', async ({ page }) => {
  await page.goto('/')
  const hero = await page.locator('#main-content').innerText()

  // JSX deletes a newline that sits next to a tag, so a closing </span> at the
  // end of a line silently glues itself to the next word. That shipped: a
  // paragraph with `flex gap-2` also double-spaced around an inline link.
  // Catch the glued case -- a lowercase letter immediately followed by an
  // uppercase one inside a word, which normal prose here never produces.
  const glued = hero.match(/\b[a-z]+[a-z][A-Z][a-z]+\b/g) ?? []
  const allowed = /KidCanvas|TestFlight|iPhone|iPad|iOS/
  expect(glued.filter((w) => !allowed.test(w)), 'words glued together').toEqual([])
})
