import { test, expect } from '@playwright/test'

/**
 * These headers are configured in next.config.js. They are easy to lose in a
 * config edit and nothing else would notice, which is the point of asserting
 * them.
 */
test('security headers are served', async ({ request }) => {
  const response = await request.get('/')
  const headers = response.headers()

  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
})

test('the CSP does not allow the retired Cloudflare hosts', async ({ request }) => {
  const csp = (await request.get('/')).headers()['content-security-policy'] ?? ''
  expect(csp).not.toContain('r2.dev')
  expect(csp).not.toContain('cloudflarestorage')
})

test('the anon Supabase key cannot read family data', async ({ request }) => {
  // The anon key ships inside the iOS app, so it is public by design. Row-level
  // security is the only thing standing between it and every family's artwork.
  // An empty array here means RLS is filtering; rows would mean it is not.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  test.skip(!url || !key, 'Supabase env not available to the test runner')

  for (const table of ['artworks', 'children', 'families', 'artwork_comments']) {
    const response = await request.get(`${url}/rest/v1/${table}?select=*&limit=1`, {
      headers: { apikey: key!, Authorization: `Bearer ${key!}` },
    })
    expect(response.ok(), `${table} request failed`).toBeTruthy()
    expect(await response.json(), `${table} is readable anonymously`).toEqual([])
  }
})

test('the artwork bucket cannot be listed anonymously', async ({ request }) => {
  // Migration 008 closed this. Before it, an anonymous caller holding the
  // shipped anon key could list every family folder, then every filename inside
  // it, then fetch the images.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  test.skip(!url || !key, 'Supabase env not available to the test runner')

  const response = await request.post(`${url}/storage/v1/object/list/artworks`, {
    headers: { apikey: key!, Authorization: `Bearer ${key!}` },
    data: { prefix: '', limit: 100 },
  })
  expect(await response.json(), 'artwork bucket is enumerable').toEqual([])
})
