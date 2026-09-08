/**
 * Capturas complementarias: pantallas que necesitan datos y estados
 * interactivos que una captura estática no muestra (menús abiertos,
 * diálogos, formularios con varias líneas).
 *
 * Crea un insumo de prueba para poder fotografiar el detalle de inventario
 * y LO ELIMINA al final desde la propia app.
 *
 *   CAP_EMAIL=... CAP_PASS=... node scripts/capturar-extras.mjs
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.CAP_URL ?? 'http://localhost:3111'
const OUT = process.env.CAP_OUT ?? 'docs/capturas'
const EMAIL = process.env.CAP_EMAIL
const PASS = process.env.CAP_PASS

if (!EMAIL || !PASS) {
  console.error('Falta CAP_EMAIL o CAP_PASS')
  process.exit(1)
}

const navegador = await chromium.launch()
const contexto = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'es-PE',
  timezoneId: 'America/Lima',
})
const page = await contexto.newPage()
await mkdir(OUT, { recursive: true })

const foto = async (nombre) => {
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${nombre}.png`, fullPage: true })
  console.log(`ok  ${nombre}`)
}

// ── Sesión ──────────────────────────────────────────────────
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.fill('input[name=email]', EMAIL)
await page.fill('input[name=password]', PASS)
await page.click('button[type=submit]')
await page.waitForURL(/\/hoy/, { timeout: 20000 })
console.log('sesión iniciada')

// ── Insumo de prueba (para el detalle de inventario) ────────
await page.goto(`${BASE}/inventario/nuevo`, { waitUntil: 'networkidle' })
await page.fill('input[name=nombre]', 'Yeso piedra (prueba)')
await page.selectOption('select[name=unidad]', 'g')
await page.fill('input[name=stock_minimo]', '500')
await page.fill('input[name=costo_unitario]', '0.05')
await page.fill('input[name=stock_inicial]', '2000')
await page.click('button[type=submit]')
await page.waitForURL(/\/inventario\/[0-9a-f-]{36}$/, { timeout: 20000 })
const urlProducto = page.url()
const idProducto = urlProducto.split('/').pop()
console.log(`insumo de prueba creado: ${idProducto}`)

// Un movimiento para que el historial no salga vacío.
await page.selectOption('select[name=tipo]', 'salida')
await page.fill('input[name=cantidad]', '150')
await page.fill('input[name=motivo]', 'Consumo de prueba')
await page.click('button:has-text("Registrar movimiento")')
await page.waitForTimeout(1500)

await page.goto(urlProducto, { waitUntil: 'networkidle' })
await foto('16-inventario-detalle')

await page.goto(`${urlProducto}/editar`, { waitUntil: 'networkidle' })
await foto('17-inventario-editar')

await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' })
await foto('14b-inventario-con-datos')

await page.goto(`${BASE}/inventario/liquidacion`, { waitUntil: 'networkidle' })
await foto('18b-liquidacion-con-datos')

// ── Estado: diálogo de confirmación ─────────────────────────
await page.goto(urlProducto, { waitUntil: 'networkidle' })
await page.click('button:has-text("Eliminar definitivo")')
await page.waitForSelector('[role=dialog]')
await foto('32-estado-dialogo-eliminar')

// Confirmar borra el insumo de prueba y deja el inventario como estaba.
await page.click('[role=dialog] button[type=submit]')
await page.waitForTimeout(2500)
console.log('insumo de prueba eliminado')

// ── Estados del formulario de trabajo ───────────────────────
await page.goto(`${BASE}/trabajos/nuevo`, { waitUntil: 'networkidle' })
await page.click('button[aria-haspopup=listbox]')
await page.waitForTimeout(300)
await foto('33-estado-buscador-de-tipo-abierto')

await page.goto(`${BASE}/trabajos/nuevo`, { waitUntil: 'networkidle' })
await page.click('button:has-text("+ Agregar otro trabajo")')
await page.waitForTimeout(300)
await page.click('button:has-text("+ Agregar otro trabajo")')
await foto('34-estado-cuenta-con-tres-lineas')

// ── Estado: menú de un técnico (permisos limitados) ─────────
await page.goto(`${BASE}/configuracion/usuarios`, { waitUntil: 'networkidle' })
await foto('30b-usuarios-permisos')

await navegador.close()
console.log(`\nListo. Imágenes en ${OUT}/`)
