import { test, expect } from '@playwright/test'

test('trabajos exige sesión', async ({ page }) => {
  await page.goto('/trabajos')
  await expect(page).toHaveURL(/\/login/)
})

test('nuevo trabajo exige sesión', async ({ page }) => {
  await page.goto('/trabajos/nuevo')
  await expect(page).toHaveURL(/\/login/)
})
