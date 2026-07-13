import { test, expect } from '@playwright/test'

test('configuración exige sesión', async ({ page }) => {
  await page.goto('/configuracion')
  await expect(page).toHaveURL(/\/login/)
})

test('catálogo exige sesión', async ({ page }) => {
  await page.goto('/configuracion/catalogo')
  await expect(page).toHaveURL(/\/login/)
})
