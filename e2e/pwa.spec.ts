import { test, expect } from '@playwright/test'

test('sirve el manifest PWA', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest')
  expect(res.status()).toBe(200)
  const manifest = await res.json()
  expect(manifest.name).toBe('GestionLab')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
})

test('sirve el icono de 192px', async ({ request }) => {
  const res = await request.get('/icons/icon-192.png')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('image/png')
})
