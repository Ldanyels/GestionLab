/**
 * Captura una imagen de cada pantalla del sistema para revisión de diseño.
 *
 *   node scripts/capturar-pantallas.mjs
 *
 * Variables de entorno:
 *   CAP_URL   Base del servidor (por defecto http://localhost:3111)
 *   CAP_EMAIL Correo del usuario con el que se inicia sesión
 *   CAP_PASS  Contraseña de ese usuario
 *   CAP_OUT   Carpeta de salida (por defecto docs/capturas)
 *   CAP_ANCHO Ancho del viewport (por defecto 390, tamaño móvil)
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.CAP_URL ?? 'http://localhost:3111'
const OUT = process.env.CAP_OUT ?? 'docs/capturas'
const ANCHO = Number(process.env.CAP_ANCHO ?? 390)
const EMAIL = process.env.CAP_EMAIL
const PASS = process.env.CAP_PASS

if (!EMAIL || !PASS) {
  console.error('Falta CAP_EMAIL o CAP_PASS')
  process.exit(1)
}

/** IDs reales de la base para las pantallas de detalle. */
const ID = {
  trabajo: process.env.CAP_ID_TRABAJO ?? '',
  consultorio: process.env.CAP_ID_CONSULTORIO ?? '',
  doctor: process.env.CAP_ID_DOCTOR ?? '',
  producto: process.env.CAP_ID_PRODUCTO ?? '',
  catalogo: process.env.CAP_ID_CATALOGO ?? '',
  trabajador: process.env.CAP_ID_TRABAJADOR ?? '',
}

/** Orden de captura: [nombre de archivo, ruta]. */
const PANTALLAS = [
  ['02-hoy', '/hoy'],
  ['03-trabajos-lista', '/trabajos'],
  ['04-trabajos-nuevo', '/trabajos/nuevo'],
  ['05-trabajo-detalle', `/trabajos/${ID.trabajo}`],
  ['06-trabajo-editar', `/trabajos/${ID.trabajo}/editar`],
  ['07-trabajo-recibo', `/trabajos/${ID.trabajo}/recibo`],
  ['08-consultorios-lista', '/consultorios'],
  ['09-consultorios-nuevo', '/consultorios/nuevo'],
  ['10-consultorio-detalle', `/consultorios/${ID.consultorio}`],
  ['11-consultorio-editar', `/consultorios/${ID.consultorio}/editar`],
  ['12-consultorios-cuentas', '/consultorios/cuentas'],
  ['13-doctor-detalle', `/doctores/${ID.doctor}`],
  ['14-inventario-lista', '/inventario'],
  ['15-inventario-nuevo', '/inventario/nuevo'],
  ['16-inventario-detalle', `/inventario/${ID.producto}`],
  ['17-inventario-editar', `/inventario/${ID.producto}/editar`],
  ['18-inventario-liquidacion', '/inventario/liquidacion'],
  ['19-finanzas', '/finanzas'],
  ['20-reportes', '/reportes'],
  ['21-reportes-ticket', '/reportes/ticket'],
  ['22-configuracion', '/configuracion'],
  ['23-catalogo-lista', '/configuracion/catalogo'],
  ['24-catalogo-nuevo', '/configuracion/catalogo/nuevo'],
  ['25-catalogo-detalle', `/configuracion/catalogo/${ID.catalogo}`],
  ['26-catalogo-editar', `/configuracion/catalogo/${ID.catalogo}/editar`],
  ['27-trabajadores-lista', '/configuracion/trabajadores'],
  ['28-trabajadores-nuevo', '/configuracion/trabajadores/nuevo'],
  ['29-trabajador-detalle', `/configuracion/trabajadores/${ID.trabajador}`],
  ['30-usuarios', '/configuracion/usuarios'],
  ['31-auditoria', '/configuracion/auditoria'],
]

const navegador = await chromium.launch()
const contexto = await navegador.newContext({
  viewport: { width: ANCHO, height: 844 },
  deviceScaleFactor: 2,
  locale: 'es-PE',
  timezoneId: 'America/Lima',
})
const page = await contexto.newPage()
await mkdir(OUT, { recursive: true })

async function capturar(nombre, ruta) {
  if (ruta.includes('//') || ruta.endsWith('/')) {
    console.log(`omitida  ${nombre} (falta el id)`)
    return
  }
  const res = await page.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${nombre}.png`, fullPage: true })
  const estado = res?.status() ?? 0
  const url = new URL(page.url()).pathname
  const aviso = url !== ruta ? ` (redirigió a ${url})` : ''
  console.log(`ok  ${nombre}  HTTP ${estado}${aviso}`)
}

// Login
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.fill('input[name=email]', EMAIL)
await page.fill('input[name=password]', PASS)
await page.click('button[type=submit]')
await page.waitForURL(/\/hoy/, { timeout: 20000 }).catch(() => {})
if (page.url().includes('/login')) {
  const err = await page.locator('[role=alert]').first().textContent().catch(() => null)
  console.error(`No se pudo iniciar sesión: ${err ?? 'credenciales rechazadas'}`)
  await navegador.close()
  process.exit(1)
}
console.log('sesión iniciada')

for (const [nombre, ruta] of PANTALLAS) {
  try {
    await capturar(nombre, ruta)
  } catch (e) {
    console.error(`falló ${nombre}: ${e.message}`)
  }
}

await navegador.close()
console.log(`\nListo. Imágenes en ${OUT}/`)
