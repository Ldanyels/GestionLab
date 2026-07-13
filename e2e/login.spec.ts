import { test, expect } from '@playwright/test'

test('redirige a login sin sesión', async ({ page }) => {
  await page.goto('/hoy')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'GestionLab' })).toBeVisible()
})

test('el formulario de login exige credenciales', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByPlaceholder('Correo')).toBeVisible()
  await expect(page.getByPlaceholder('Contraseña')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
})
