/**
 * Comprueba que el dominio y el correo quedaron bien configurados.
 *
 *   node scripts/verificar-dominio.mjs
 *
 * No necesita credenciales: consulta el DNS público y hace una petición HTTP.
 * Sirve para no depender de "creo que ya lo puse": cada punto sale ✓ o ✗ con
 * el motivo, y el código de salida es 1 si falta algo.
 */
import { Resolver } from 'node:dns/promises'

const DOMINIO = process.env.DOMINIO ?? 'skardiam.com'
const SUB = process.env.SUB ?? 'gestionlab'
const HOST = `${SUB}.${DOMINIO}`

// Resolutores públicos: evita la caché del equipo y del router, que suele
// mostrar el estado de hace horas.
const dns = new Resolver()
dns.setServers(['1.1.1.1', '8.8.8.8'])

let fallas = 0

function ok(titulo, detalle = '') {
  console.log(`  ✓ ${titulo}${detalle ? ` — ${detalle}` : ''}`)
}
function mal(titulo, detalle = '') {
  fallas++
  console.log(`  ✗ ${titulo}${detalle ? ` — ${detalle}` : ''}`)
}
function aviso(titulo, detalle = '') {
  console.log(`  ! ${titulo}${detalle ? ` — ${detalle}` : ''}`)
}

async function intentar(fn) {
  try {
    return await fn()
  } catch (e) {
    return { error: e.code ?? e.message }
  }
}

// ── 1. El subdominio de la aplicación ─────────────────────────
console.log(`\nSubdominio de la aplicación (${HOST})`)

const cname = await intentar(() => dns.resolveCname(HOST))
if (Array.isArray(cname) && cname.length) {
  const apunta = cname.join(', ')
  if (/vercel-dns\.com$/i.test(apunta)) ok('CNAME hacia Vercel', apunta)
  else mal('el CNAME no apunta a Vercel', apunta)
} else {
  const a = await intentar(() => dns.resolve4(HOST))
  if (Array.isArray(a) && a.length) {
    aviso('resuelve por registro A, no por CNAME', a.join(', '))
    aviso('si el proxy de Cloudflare está en naranja, ponlo en gris (DNS only)')
    fallas++
  } else {
    mal('no resuelve', `crea el CNAME ${SUB} → cname.vercel-dns.com (en gris)`)
  }
}

// ── 2. Que responda por HTTPS y no sea el muro de Vercel ──────
console.log(`\nRespuesta HTTPS de https://${HOST}/login`)
try {
  const r = await fetch(`https://${HOST}/login`, { redirect: 'manual' })
  const destino = r.headers.get('location') ?? ''
  if (/vercel\.com\/sso-api/.test(destino)) {
    mal(
      `responde ${r.status} pero redirige al acceso de Vercel`,
      'desactiva Deployment Protection para producción en Vercel → Settings → Deployment Protection',
    )
  } else if (r.status === 200) {
    ok('sirve el login', `HTTP ${r.status}`)
  } else if (r.status >= 300 && r.status < 400) {
    aviso(`redirige a ${destino || '(sin cabecera)'}`, `HTTP ${r.status}`)
  } else {
    mal(`respuesta inesperada`, `HTTP ${r.status}`)
  }
} catch (e) {
  mal('no se pudo conectar', e.cause?.code ?? e.message)
}

// ── 3. Los registros que pide Resend ──────────────────────────
// Resend usa un subdominio propio (send.<dominio>) para no chocar con el SPF
// que el dominio ya pueda tener para su correo normal.
console.log(`\nRegistros de Resend`)

const dkim = await intentar(() => dns.resolveTxt(`resend._domainkey.${DOMINIO}`))
if (Array.isArray(dkim) && dkim.length) {
  const valor = dkim.flat().join('')
  if (/p=/.test(valor)) ok('DKIM presente', `${valor.slice(0, 34)}…`)
  else mal('el TXT de DKIM existe pero no parece una clave', valor.slice(0, 40))
} else {
  mal(
    `falta el TXT resend._domainkey.${DOMINIO}`,
    'cópialo del panel de Resend; en Cloudflare el nombre va sin el dominio: resend._domainkey',
  )
}

const mx = await intentar(() => dns.resolveMx(`send.${DOMINIO}`))
if (Array.isArray(mx) && mx.length) {
  ok('MX de retorno presente', mx.map((m) => `${m.priority} ${m.exchange}`).join(', '))
} else {
  mal(`falta el MX de send.${DOMINIO}`, 'lo da Resend; en Cloudflare el nombre va como: send')
}

const spf = await intentar(() => dns.resolveTxt(`send.${DOMINIO}`))
if (Array.isArray(spf) && spf.length) {
  const valor = spf.flat().join(' ')
  if (/v=spf1/.test(valor)) ok('SPF presente', valor.slice(0, 50))
  else mal('hay TXT pero sin SPF', valor.slice(0, 50))
} else {
  mal(`falta el TXT de SPF en send.${DOMINIO}`, 'lo da Resend')
}

// ── 4. Aviso sobre el SPF del dominio principal ───────────────
const spfRaiz = await intentar(() => dns.resolveTxt(DOMINIO))
if (Array.isArray(spfRaiz)) {
  const spfs = spfRaiz.flat().filter((t) => /v=spf1/i.test(t))
  if (spfs.length > 1) {
    console.log('')
    mal(
      `${DOMINIO} tiene ${spfs.length} registros SPF`,
      'solo puede haber uno; dos rompen la entrega de todo el correo del dominio',
    )
  }
}

// ── Resumen ───────────────────────────────────────────────────
console.log(`\n${'─'.repeat(58)}`)
if (fallas === 0) {
  console.log('✓ Dominio y correo listos.')
  process.exit(0)
}
console.log(`✗ Faltan ${fallas} cosa(s). El DNS puede tardar unos minutos en propagarse;`)
console.log('  si acabas de crear los registros, espera 5 minutos y vuelve a correrlo.')
process.exit(1)
