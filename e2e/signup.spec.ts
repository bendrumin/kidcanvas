import { test, expect } from '@playwright/test'

/**
 * The full signup journey, against whatever PLAYWRIGHT_BASE_URL points at.
 *
 * Gated behind RUN_SIGNUP_E2E because it creates a real account in the real
 * Supabase project every run (maestro-web-*@example.com, which the iOS
 * suite's cleanup sweep deletes). Run it after touching anything in the auth
 * flow, and against production after deploying such a change:
 *
 *   RUN_SIGNUP_E2E=1 PLAYWRIGHT_BASE_URL=https://kidcanvas.app \
 *     npx playwright test e2e/signup.spec.ts
 *
 * Exists because router.push('/dashboard') + router.refresh() raced: the
 * refresh cancelled the push, the page stayed on /signup with no error, and
 * every web signup silently dead-ended for three weeks. The API calls all
 * returned 200, so nothing server-side ever looked wrong.
 */
test('signing up lands in the dashboard', async ({ page }) => {
  test.skip(!process.env.RUN_SIGNUP_E2E, 'creates a real account; opt in with RUN_SIGNUP_E2E=1')

  await page.goto('/signup')
  await page.fill('input[type="email"]', `maestro-web-${Date.now()}@example.com`)
  await page.fill('input[type="password"]', 'ProbePass!23')
  for (const input of await page.locator('input[type="text"], input:not([type])').all()) {
    await input.fill('Probe Signup')
  }
  await page.click('button:has-text("Create Account")')

  // the whole bug: this navigation must actually happen
  await page.waitForURL(/\/dashboard/, { timeout: 30000 })
  await expect(page).toHaveURL(/\/dashboard/)
})
