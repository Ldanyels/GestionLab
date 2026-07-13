import { test, expect } from '@playwright/test'

test('consultorios exige sesión', async ({ page }) => {
  await page.goto('/consultorios')
  await expect(page).toHaveURL(/\/login/)
})

test('nuevo consultorio exige sesión', async ({ page }) => {
  await page.goto('/consultorios/nuevo')
  await expect(page).toHaveURL(/\/login/)
})
