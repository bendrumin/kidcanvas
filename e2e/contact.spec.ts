import { test, expect } from '@playwright/test'

/**
 * The contact form silently failed in production for as long as it existed: it
 * POSTed to Formspree, which this site's own Content-Security-Policy blocks, so
 * the browser killed every submission. It now posts to /api/contact. These
 * tests pin the contract without sending real email.
 */
test('the support form renders with its fields', async ({ page }) => {
  await page.goto('/support')
  await expect(page.locator('#name')).toBeVisible()
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#message')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('the form no longer posts to a CSP-blocked third party', async ({ page }) => {
  const source = await (await page.goto('/support'))?.text()
  expect(source).not.toContain('formspree')
})

test('the contact API rejects an empty submission', async ({ request }) => {
  const response = await request.post('/api/contact', {
    headers: { Origin: 'http://localhost:3000' },
    data: {},
  })
  expect(response.status()).toBe(400)
})

test('the contact API rejects a bad email', async ({ request }) => {
  const response = await request.post('/api/contact', {
    headers: { Origin: 'http://localhost:3000' },
    data: { name: 'Test', email: 'not-an-email', message: 'hello' },
  })
  expect(response.status()).toBe(400)
})

test('the honeypot swallows bot submissions without sending', async ({ request }) => {
  // A filled honeypot returns success immediately -- before validation, before
  // Resend -- so a bot learns nothing and no email goes out.
  const response = await request.post('/api/contact', {
    headers: { Origin: 'http://localhost:3000' },
    data: { name: 'Bot', email: 'bot@spam.example', message: 'buy now', company: 'SpamCo' },
  })
  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ success: true })
})

test('the contact API refuses cross-origin posts', async ({ request }) => {
  const response = await request.post('/api/contact', {
    headers: { Origin: 'https://evil.example' },
    data: { name: 'X', email: 'x@example.com', message: 'hi' },
  })
  expect(response.status()).toBe(403)
})
