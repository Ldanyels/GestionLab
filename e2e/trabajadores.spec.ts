import { test, expect } from '@playwright/test'

test('trabajadores exige sesión', async ({ page }) => {
  await page.goto('/configuracion/trabajadores')
  await expect(page).toHaveURL(/\/login/)
})
