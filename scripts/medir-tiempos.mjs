/**
 * Mide cuánto tarda cada pantalla en responder, con sesión real.
 *
 *   CAP_EMAIL=... CAP_PASS=... node scripts/medir-tiempos.mjs
 *
 * Reporta el tiempo hasta el primer byte (servidor: auth + consultas + render)
 * y el tiempo hasta que la página queda usable. Dos pasadas: la primera
 * incluye el arranque en frío, la segunda es el caso normal.
 */
import { chromium } from '@playwright/test'

const BASE = process.env.CAP_URL ?? 'http://localhost:3222'
const EMAIL = process.env.CAP_EMAIL
const PASS = process.env.CAP_PASS

if (!EMAIL || !PASS) {
  console.error('Falta CAP_EMAIL o CAP_PASS')
  process.exit(1)
}

const RUTAS = [
  '/hoy',
  '/trabajos',
  '/consultorios',
  '/inventario',
  '/finanzas',
  '/reportes',
  '/consultorios/cuentas',
  '/configuracion',
]

const navegador = await chromium.launch()
const page = await navegador.newPage({ viewport: { width: 390, height: 844 } })

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.fill('input[name=email]', EMAIL)
await page.fill('input[name=password]', PASS)
await page.click('button[type=submit]')
await page.waitForURL(/\/hoy/, { timeout: 30000 })

async function medir(ruta) {
  const t0 = Date.now()
  const res = await page.goto(`${BASE}${ruta}`, { waitUntil: 'commit' })
  const ttfb = Date.now() - t0
  await page.waitForLoadState('load')
  const total = Date.now() - t0
  return { ruta, estado: res?.status() ?? 0, ttfb, total }
}

for (const vuelta of [1, 2]) {
  console.log(`\n--- pasada ${vuelta} ${vuelta === 1 ? '(incluye arranque en frío)' : '(caso normal)'} ---`)
  console.log('ruta'.padEnd(26), 'servidor'.padStart(9), 'total'.padStart(8))
  for (const ruta of RUTAS) {
    const m = await medir(ruta)
    console.log(ruta.padEnd(26), `${m.ttfb} ms`.padStart(9), `${m.total} ms`.padStart(8))
  }
}

await navegador.close()
