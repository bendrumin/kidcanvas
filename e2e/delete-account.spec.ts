import { test, expect } from '@playwright/test'

/**
 * Account deletion, end to end, because this button lied for months: it opened
 * a dialog promising permanent deletion and then fired a "Coming soon!" toast,
 * while Google Play's Data Safety form named the web as a working deletion
 * path the whole time.
 *
 * Creates and destroys a real account, so it is opt-in:
 *   RUN_DELETE_E2E=1 npx playwright test e2e/delete-account.spec.ts
 */
test('a new account can delete itself', async ({ page, browserName }) => {
  test.skip(!process.env.RUN_DELETE_E2E, 'creates a real account; opt in with RUN_DELETE_E2E=1')
  test.skip(browserName !== 'chromium', 'account-creating test runs once')

  const email = `maestro-del-${Date.now()}@example.com`
  const password = 'ProbePass!23'

  await page.goto('/signup')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  for (const input of await page.locator('input[type="text"], input:not([type])').all()) {
    await input.fill('Delete Probe')
  }
  await page.click('button:has-text("Create Account")')
  await page.waitForURL(/\/dashboard/, { timeout: 30000 })

  await page.goto('/dashboard/settings')
  await page.click('button:has-text("Delete Account")')
  // The confirm lives inside the dialog; the trigger behind the overlay has the
  // same label, so scope to the dialog or you just re-click the trigger.
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /delete account/i }).click()

  // The real thing signs out and lands on the marketing page. The fake left you
  // sitting on settings with a toast.
  await page.waitForURL((url) => !url.pathname.startsWith('/dashboard'), { timeout: 30000 })

  // And it must actually be gone: signing back in has to fail.
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Sign In")')
  await page.waitForTimeout(6000)
  expect(page.url(), 'a deleted account could still sign in').not.toMatch(/\/dashboard/)
})
