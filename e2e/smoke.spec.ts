import { test, expect } from '@playwright/test'

test('la home responde', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})
