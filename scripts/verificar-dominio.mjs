/**
 * Comprueba que el dominio y el correo quedaron bien configurados.
 *
 *   node scripts/verificar-dominio.mjs
 *
 * No necesita credenciales: consulta el DNS y hace una petición HTTP.
 * Sirve para no depender de "creo que ya lo puse": cada punto sale ✓ o ✗ con
 * el motivo, y el código de salida es 1 si falta algo.
 *
 * Las consultas van por DNS sobre HTTPS y no por el resolutor del sistema. Dos
 * razones: esquiva la caché del equipo y del router, que suele mostrar el
 * estado de hace horas; y evita el resolutor nativo de Node, que en Windows no
 * libera sus descriptores al terminar y hace que el proceso aborte con
 * "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)" devolviendo 127 —
 * justo lo contrario de lo que este script debe reportar.
 */

const DOMINIO = process.env.DOMINIO ?? 'skardiam.com'
const SUB = process.env.SUB ?? 'gestionlab'
const HOST = `${SUB}.${DOMINIO}`

const TIPO = { A: 1, CNAME: 5, MX: 15, TXT: 16 }

/** Consulta un registro por DNS sobre HTTPS. Devuelve los datos o []. */
async function consultar(nombre, tipo) {
  try {
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(nombre)}&type=${tipo}`,
      { headers: { accept: 'application/dns-json' } },
    )
    if (!r.ok) return []
    const json = await r.json()
    return (json.Answer ?? [])
      .filter((a) => a.type === TIPO[tipo])
      .map((a) => a.data.replace(/^"|"$/g, '').replace(/"\s+"/g, '').replace(/\.$/, ''))
  } catch {
    return []
  }
}

let fallas = 0
const ok = (t, d = '') => console.log(`  ✓ ${t}${d ? ` — ${d}` : ''}`)
const mal = (t, d = '') => {
  fallas++
  console.log(`  ✗ ${t}${d ? ` — ${d}` : ''}`)
}
const aviso = (t, d = '') => console.log(`  ! ${t}${d ? ` — ${d}` : ''}`)

// ── 1. El subdominio de la aplicación ─────────────────────────
console.log(`\nSubdominio de la aplicación (${HOST})`)

const cname = await consultar(HOST, 'CNAME')
if (cname.length) {
  if (cname.some((c) => /vercel-dns\.com$/i.test(c))) ok('CNAME hacia Vercel', cname.join(', '))
  else mal('el CNAME no apunta a Vercel', cname.join(', '))
} else {
  const a = await consultar(HOST, 'A')
  if (a.length) {
    mal('resuelve por registro A, no por CNAME', a.join(', '))
    aviso('si el proxy de Cloudflare está en naranja, ponlo en gris (DNS only)')
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
      'desactiva Deployment Protection para producción en Vercel → Settings',
    )
  } else if (r.status === 200) {
    ok('sirve el login', `HTTP ${r.status}`)
  } else if (r.status >= 300 && r.status < 400) {
    aviso(`redirige a ${destino || '(sin cabecera)'}`, `HTTP ${r.status}`)
  } else {
    mal('respuesta inesperada', `HTTP ${r.status}`)
  }
} catch (e) {
  mal('no se pudo conectar', e.cause?.code ?? e.message)
}

// ── 3. Los registros que pide Resend ──────────────────────────
// Resend usa un subdominio propio (send.<dominio>) para no chocar con el SPF
// que el dominio ya pueda tener para su correo normal.
console.log(`\nRegistros de Resend`)

const dkim = await consultar(`resend._domainkey.${DOMINIO}`, 'TXT')
if (dkim.length) {
  const valor = dkim.join('')
  if (/p=/.test(valor)) ok('DKIM presente', `${valor.slice(0, 34)}…`)
  else mal('el TXT de DKIM existe pero no parece una clave', valor.slice(0, 40))
} else {
  mal(
    `falta el TXT resend._domainkey.${DOMINIO}`,
    'en Cloudflare el nombre va sin el dominio: resend._domainkey',
  )
}

const mx = await consultar(`send.${DOMINIO}`, 'MX')
if (mx.length) ok('MX de retorno presente', mx.join(', '))
else mal(`falta el MX de send.${DOMINIO}`, 'en Cloudflare el nombre va como: send')

const spf = await consultar(`send.${DOMINIO}`, 'TXT')
if (spf.length) {
  const valor = spf.join(' ')
  if (/v=spf1/.test(valor)) ok('SPF presente', valor.slice(0, 50))
  else mal('hay TXT pero sin SPF', valor.slice(0, 50))
} else {
  mal(`falta el TXT de SPF en send.${DOMINIO}`, 'lo da Resend')
}

// ── 4. Un solo SPF en el dominio raíz ─────────────────────────
const raiz = await consultar(DOMINIO, 'TXT')
const spfs = raiz.filter((t) => /v=spf1/i.test(t))
if (spfs.length > 1) {
  console.log('')
  mal(
    `${DOMINIO} tiene ${spfs.length} registros SPF`,
    'solo puede haber uno; dos rompen la entrega de todo el correo del dominio',
  )
}

// ── Resumen ───────────────────────────────────────────────────
console.log(`\n${'─'.repeat(58)}`)
if (fallas === 0) {
  console.log('✓ Dominio y correo listos.')
} else {
  console.log(`✗ Faltan ${fallas} cosa(s). El DNS puede tardar unos minutos en propagarse;`)
  console.log('  si acabas de crear los registros, espera 5 minutos y vuelve a correrlo.')
}
process.exitCode = fallas === 0 ? 0 : 1
