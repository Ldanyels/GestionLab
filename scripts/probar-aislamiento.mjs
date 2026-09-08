/**
 * Pruebas de aislamiento entre inquilinos.
 *
 *   CONFIRMO=si node --env-file=.env.local scripts/probar-aislamiento.mjs
 *
 * Crea dos laboratorios desechables con datos en las 14 tablas escribibles,
 * entra como administrador del primero y comprueba que no puede ver ni tocar
 * nada del segundo: ni leyendo, ni actualizando, ni borrando, ni insertando con
 * el `laboratorio_id` ajeno. Comprueba también las funciones RPC y que un
 * usuario sin perfil no pueda crearse uno apuntando a otro laboratorio (el
 * agujero que cerró la migración 0018).
 *
 * Para qué sirve: al mudarse a Azure hay que rehacer a mano las 17 políticas de
 * seguridad a nivel de fila y la resolución del inquilino, porque `auth.uid()`
 * es de Supabase y en PostgreSQL puro no existe. Esta suite convierte esa
 * migración de "espero no haber roto el aislamiento" a "la suite me dice si lo
 * rompí". Las comprobaciones son de comportamiento, no de Supabase, así que
 * valen igual del otro lado.
 *
 * Todo lo que crea lleva el prefijo `zz-aislamiento` y se borra al final,
 * incluso si una comprobación falla. Nunca borra nada que no haya creado.
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY

if (process.env.CONFIRMO !== 'si') {
  console.error(
    [
      'Esta prueba crea y borra datos reales en el proyecto de Supabase configurado.',
      `Proyecto: ${URL ?? '(sin NEXT_PUBLIC_SUPABASE_URL)'}`,
      '',
      'Si es el proyecto correcto, vuelve a ejecutarla así:',
      '  CONFIRMO=si node --env-file=.env.local scripts/probar-aislamiento.mjs',
    ].join('\n'),
  )
  process.exit(1)
}

if (!URL || !ANON || !SERVICIO) {
  console.error(
    'Faltan variables. Ejecuta con: node --env-file=.env.local scripts/probar-aislamiento.mjs',
  )
  process.exit(1)
}

const PREFIJO = 'zz-aislamiento'
const CLAVE = `Aisl-${randomUUID().slice(0, 12)}!`

/**
 * Marcas del laboratorio B: un texto irrepetible y un importe absurdo.
 *
 * Sirven para detectar fugas sin depender de la forma de la respuesta. Las
 * funciones RPC devuelven agregados que no traen `laboratorio_id`, así que
 * comparar ese campo no probaría nada; en cambio, si el texto o el importe de B
 * aparecen en cualquier respuesta que ve A, hay fuga, venga como venga.
 */
const MARCA_B = `FUGA-${randomUUID().slice(0, 8).toUpperCase()}`
const MONTO_B = 77777.77

const LADO_A = { etiqueta: 'propio', monto: 30 }
const LADO_B = { etiqueta: MARCA_B, monto: MONTO_B }

/** ¿Aparece algo de B en esta respuesta? */
function hayFuga(valor) {
  const texto = JSON.stringify(valor ?? null)
  return texto.includes(MARCA_B) || texto.includes('77777')
}

const admin = createClient(URL, SERVICIO, { auth: { persistSession: false } })

// ── Registro de resultados ────────────────────────────────────
let pasadas = 0
const fallas = []

function comprobar(descripcion, condicion, detalle = '') {
  if (condicion) {
    pasadas++
  } else {
    fallas.push(`${descripcion}${detalle ? ` — ${detalle}` : ''}`)
    console.log(`  ✗ ${descripcion}${detalle ? ` — ${detalle}` : ''}`)
  }
}

// ── Especificación de las tablas ──────────────────────────────
// `fila` construye un registro válido para el laboratorio dado, usando los
// identificadores ya creados en ese mismo laboratorio. `cambio` es el intento
// de modificación que debe rebotar.
const TABLAS = [
  {
    nombre: 'consultorio',
    fila: (lab, ids, m) => ({ laboratorio_id: lab, nombre: `${PREFIJO} consultorio ${m.etiqueta}` }),
    cambio: { nombre: `${PREFIJO} intruso` },
  },
  {
    nombre: 'doctor',
    fila: (lab, ids, m) => ({
      laboratorio_id: lab,
      consultorio_id: ids.consultorio,
      nombre: `${PREFIJO} doctor ${m.etiqueta}`,
    }),
    cambio: { nombre: `${PREFIJO} intruso` },
  },
  {
    nombre: 'catalogo_trabajo',
    fila: (lab, ids, m) => ({
      laboratorio_id: lab,
      categoria: 'Fija',
      nombre: `${PREFIJO} corona ${m.etiqueta}`,
      precio_base: m.monto,
    }),
    cambio: { precio_base: 1 },
  },
  {
    nombre: 'plantilla_etapa',
    fila: (lab, ids, m) => ({
      laboratorio_id: lab,
      catalogo_trabajo_id: ids.catalogo_trabajo,
      nombre: `${PREFIJO} etapa ${m.etiqueta}`,
      orden: 1,
    }),
    cambio: { orden: 99 },
  },
  {
    nombre: 'producto',
    fila: (lab, ids, m) => ({ laboratorio_id: lab, nombre: `${PREFIJO} yeso ${m.etiqueta}`, unidad: 'kg' }),
    cambio: { stock_actual: 999 },
  },
  {
    nombre: 'receta',
    fila: (lab, ids) => ({
      laboratorio_id: lab,
      catalogo_trabajo_id: ids.catalogo_trabajo,
      producto_id: ids.producto,
      cantidad: 2,
    }),
    cambio: { cantidad: 99 },
  },
  {
    nombre: 'trabajo',
    fila: (lab, ids, m) => ({
      laboratorio_id: lab,
      doctor_id: ids.doctor,
      catalogo_trabajo_id: ids.catalogo_trabajo,
      paciente_nombre: `${PREFIJO} paciente ${m.etiqueta}`,
      precio_acordado: m.monto,
    }),
    cambio: { paciente_nombre: `${PREFIJO} intruso` },
  },
  {
    nombre: 'trabajo_etapa',
    fila: (lab, ids, m) => ({
      laboratorio_id: lab,
      trabajo_id: ids.trabajo,
      nombre: `${PREFIJO} etapa ${m.etiqueta}`,
      orden: 1,
    }),
    cambio: { estado: 'completada' },
  },
  {
    nombre: 'trabajo_item',
    fila: (lab, ids, m) => ({
      laboratorio_id: lab,
      trabajo_id: ids.trabajo,
      catalogo_trabajo_id: ids.catalogo_trabajo,
      cantidad: 1,
      precio_unitario: m.monto,
      subtotal: m.monto,
    }),
    cambio: { subtotal: 1 },
  },
  {
    nombre: 'abono',
    fila: (lab, ids, m) => ({ laboratorio_id: lab, trabajo_id: ids.trabajo, monto: m.monto }),
    cambio: { monto: 1 },
  },
  {
    nombre: 'movimiento_inventario',
    fila: (lab, ids, m) => ({
      laboratorio_id: lab,
      producto_id: ids.producto,
      tipo: 'ingreso',
      cantidad: 5,
      motivo: `${PREFIJO} ${m.etiqueta}`,
    }),
    cambio: { cantidad: 999 },
  },
  {
    nombre: 'trabajador',
    fila: (lab, ids, m) => ({ laboratorio_id: lab, nombre: `${PREFIJO} tecnico ${m.etiqueta}` }),
    cambio: { nombre: `${PREFIJO} intruso` },
  },
  {
    nombre: 'monto_estandar',
    fila: (lab, ids, m) => ({
      laboratorio_id: lab,
      trabajador_id: ids.trabajador,
      catalogo_trabajo_id: ids.catalogo_trabajo,
      monto: m.monto,
    }),
    cambio: { monto: 1 },
  },
  {
    nombre: 'pago_trabajador',
    fila: (lab, ids, m) => ({ laboratorio_id: lab, trabajador_id: ids.trabajador, monto: m.monto }),
    cambio: { monto: 1 },
  },
]

// ── Preparación ───────────────────────────────────────────────
async function crearLaboratorio(sufijo) {
  const { data, error } = await admin
    .from('laboratorio')
    .insert({ nombre: `${PREFIJO} ${sufijo}` })
    .select('id')
    .single()
  if (error) throw new Error(`No se pudo crear el laboratorio ${sufijo}: ${error.message}`)
  return data.id
}

async function crearUsuario(etiqueta, laboratorioId) {
  const email = `${PREFIJO}-${etiqueta}-${randomUUID().slice(0, 8)}@ejemplo.invalid`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: CLAVE,
    email_confirm: true,
  })
  if (error) throw new Error(`No se pudo crear el usuario ${etiqueta}: ${error.message}`)

  // El usuario huérfano se queda sin perfil a propósito: es el que prueba la 0018.
  if (laboratorioId) {
    const { error: errPerfil } = await admin.from('perfil').insert({
      id: data.user.id,
      laboratorio_id: laboratorioId,
      nombre: `${PREFIJO} ${etiqueta}`,
      rol: 'admin',
    })
    if (errPerfil) throw new Error(`No se pudo crear el perfil ${etiqueta}: ${errPerfil.message}`)
  }

  return { id: data.user.id, email }
}

async function sembrar(laboratorioId, lado) {
  const ids = {}
  for (const tabla of TABLAS) {
    const { data, error } = await admin
      .from(tabla.nombre)
      .insert(tabla.fila(laboratorioId, ids, lado))
      .select('id')
      .single()
    if (error) throw new Error(`Siembra de ${tabla.nombre} falló: ${error.message}`)
    ids[tabla.nombre] = data.id
  }
  return ids
}

// ── Comprobaciones ────────────────────────────────────────────
async function comprobarTablas(comoA, labA, idsA, labB, idsB) {
  console.log('\nAislamiento tabla por tabla')
  for (const tabla of TABLAS) {
    const t = tabla.nombre

    // 1. Todo lo visible pertenece al laboratorio propio.
    const { data: visibles, error: errLectura } = await comoA.from(t).select('*')
    comprobar(`${t}: la lectura no falla`, !errLectura, errLectura?.message)
    const ajenas = (visibles ?? []).filter((f) => f.laboratorio_id !== labA)
    comprobar(`${t}: no se ve ninguna fila de otro laboratorio`, ajenas.length === 0,
      ajenas.length ? `${ajenas.length} fila(s) ajena(s)` : '')

    // Red independiente del `laboratorio_id`: los datos de B llevan una marca
    // irrepetible, así que si aparece en la respuesta hay fuga aunque el
    // campo de inquilino se viera correcto.
    comprobar(`${t}: la respuesta no contiene la marca del otro laboratorio`, !hayFuga(visibles))

    // 2. La fila propia sí se ve: si no, la prueba no probaría nada.
    comprobar(
      `${t}: la fila propia es visible`,
      (visibles ?? []).some((f) => f.id === idsA[t]),
    )

    // 3. La fila del otro laboratorio no se ve ni pidiéndola por id.
    const { data: directa } = await comoA.from(t).select('id').eq('id', idsB[t])
    comprobar(`${t}: pedir la fila ajena por id no devuelve nada`, (directa ?? []).length === 0)

    // 4. No se puede modificar la fila ajena.
    const { data: modificadas } = await comoA
      .from(t)
      .update(tabla.cambio)
      .eq('id', idsB[t])
      .select('id')
    comprobar(`${t}: no se puede modificar la fila ajena`, (modificadas ?? []).length === 0)

    // 5. No se puede borrar la fila ajena.
    const { data: borradas } = await comoA.from(t).delete().eq('id', idsB[t]).select('id')
    comprobar(`${t}: no se puede borrar la fila ajena`, (borradas ?? []).length === 0)

    // 6. No se puede insertar poniendo el laboratorio_id ajeno.
    const { error: errInsercion } = await comoA
      .from(t)
      .insert(tabla.fila(labB, idsB, LADO_B))
      .select('id')
    comprobar(`${t}: no se puede insertar con el laboratorio_id ajeno`, errInsercion !== null)
  }
}

async function comprobarLaboratorioYPerfil(comoA, labA, labB, usuarioB) {
  console.log('\nTablas de control')

  const { data: labs } = await comoA.from('laboratorio').select('id')
  comprobar('laboratorio: solo se ve el propio', (labs ?? []).length === 1 && labs[0].id === labA)
  comprobar(
    'laboratorio: no se ve el ajeno',
    !(labs ?? []).some((l) => l.id === labB),
  )

  const { data: perfiles } = await comoA.from('perfil').select('id, laboratorio_id')
  comprobar(
    'perfil: no se ve el perfil de otro laboratorio',
    !(perfiles ?? []).some((p) => p.id === usuarioB.id),
  )

  const { data: auditoria, error: errAuditoria } = await comoA.from('auditoria').select('*')
  if (errAuditoria?.code === 'PGRST205') {
    // La tabla no está en la base: migración sin aplicar, no fallo de
    // aislamiento. Se reporta aparte para no confundir los dos problemas.
    console.log('  ! auditoria: la tabla no existe en la base — migración sin aplicar')
    return ['auditoria (tabla)']
  }
  comprobar('auditoria: la lectura no falla', !errAuditoria, errAuditoria?.message)
  comprobar(
    'auditoria: no se ven registros de otro laboratorio',
    !(auditoria ?? []).some((a) => a.laboratorio_id && a.laboratorio_id !== labA),
  )
  comprobar('auditoria: la respuesta no contiene la marca del otro laboratorio', !hayFuga(auditoria))
  return []
}

async function comprobarRpc(comoA) {
  console.log('\nFunciones RPC')
  // Firmas tomadas de las migraciones: los nombres de parámetro importan, un
  // nombre equivocado devuelve PGRST202 y parece que la función no existiera.
  const RANGO = { p_desde: '2000-01-01', p_hasta: '2100-12-31' }
  const llamadas = [
    ['finanzas_resumen', RANGO],
    ['finanzas_por_mes', { p_meses: 12 }],
    ['ranking_consultorios', RANGO],
    ['consumo_por_producto', RANGO],
    ['estado_cuenta_consultorios', {}],
    ['deuda_por_consultorio', {}],
  ]

  const ausentes = []
  for (const [nombre, argumentos] of llamadas) {
    const { data, error } = await comoA.rpc(nombre, argumentos)
    if (error?.code === 'PGRST202') {
      // La función no está en la base. No es un fallo de aislamiento, pero sí
      // una migración sin aplicar: se reporta aparte.
      ausentes.push(nombre)
      console.log(`  ! ${nombre}: no existe en la base — migración sin aplicar`)
      continue
    }
    comprobar(`${nombre}: la llamada no falla`, !error, error?.message)
    // Los agregados no traen `laboratorio_id`, así que se busca la marca de B.
    comprobar(`${nombre}: no devuelve datos de otro laboratorio`, !hayFuga(data))
  }
  return ausentes
}

async function comprobarHuerfano(labB) {
  console.log('\nMigración 0018: un usuario sin perfil no puede adoptar un laboratorio')
  const huerfano = await crearUsuario('huerfano', null)

  const comoHuerfano = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: errEntrada } = await comoHuerfano.auth.signInWithPassword({
    email: huerfano.email,
    password: CLAVE,
  })
  comprobar('el usuario sin perfil puede autenticarse', !errEntrada, errEntrada?.message)

  const { data, error } = await comoHuerfano
    .from('perfil')
    .insert({
      id: huerfano.id,
      laboratorio_id: labB,
      nombre: `${PREFIJO} intruso`,
      rol: 'admin',
    })
    .select('id')

  comprobar(
    'no puede insertarse un perfil apuntando a un laboratorio ajeno',
    error !== null && (data ?? []).length === 0,
    error ? '' : 'LA INSERCIÓN FUE ACEPTADA: la política perfil_self_insert sigue viva',
  )

  return huerfano
}

// ── Limpieza ──────────────────────────────────────────────────
async function limpiar(laboratorios, usuarios) {
  console.log('\nLimpieza')

  // El orden importa: `perfil.laboratorio_id` es `on delete restrict`, así que
  // mientras exista un perfil apuntando al laboratorio, el laboratorio no se
  // puede borrar. Primero los usuarios (borrarlos arrastra su perfil en
  // cascada desde `auth.users`), después los laboratorios.
  for (const u of usuarios.filter(Boolean)) {
    const { error } = await admin.auth.admin.deleteUser(u.id)
    console.log(`  ${error ? '✗' : '·'} usuario ${u.email}${error ? ` — ${error.message}` : ''}`)
  }

  for (const id of laboratorios.filter(Boolean)) {
    // Barrido por si quedó algún perfil suelto (por ejemplo, uno creado por un
    // intento de intrusión que la prueba detectó como exitoso).
    const { data: sueltos } = await admin.from('perfil').select('id').eq('laboratorio_id', id)
    for (const p of sueltos ?? []) {
      await admin.auth.admin.deleteUser(p.id)
      await admin.from('perfil').delete().eq('id', p.id)
    }

    const { error } = await admin.from('laboratorio').delete().eq('id', id)
    console.log(`  ${error ? '✗' : '·'} laboratorio ${id}${error ? ` — ${error.message}` : ''}`)
  }
}

// ── Ejecución ─────────────────────────────────────────────────
const laboratorios = []
const usuarios = []
/** Tablas y funciones que el código espera pero que no están en la base. */
const ausentes = []

try {
  console.log(`Proyecto: ${URL}`)
  console.log('Preparando dos laboratorios desechables…')

  const labA = await crearLaboratorio('A')
  laboratorios.push(labA)
  const labB = await crearLaboratorio('B')
  laboratorios.push(labB)

  const usuarioA = await crearUsuario('admin-a', labA)
  usuarios.push(usuarioA)
  const usuarioB = await crearUsuario('admin-b', labB)
  usuarios.push(usuarioB)

  const idsA = await sembrar(labA, LADO_A)
  const idsB = await sembrar(labB, LADO_B)
  console.log(`Sembradas ${TABLAS.length} tablas en cada laboratorio (marca de B: ${MARCA_B}).`)

  const comoA = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: errEntrada } = await comoA.auth.signInWithPassword({
    email: usuarioA.email,
    password: CLAVE,
  })
  if (errEntrada) throw new Error(`No se pudo iniciar sesión como A: ${errEntrada.message}`)

  await comprobarTablas(comoA, labA, idsA, labB, idsB)
  ausentes.push(...(await comprobarLaboratorioYPerfil(comoA, labA, labB, usuarioB)))
  ausentes.push(...(await comprobarRpc(comoA)))
  usuarios.push(await comprobarHuerfano(labB))
} catch (e) {
  fallas.push(`Error de preparación: ${e.message}`)
  console.error(`\n✗ ${e.message}`)
} finally {
  await limpiar(laboratorios, usuarios)
}

console.log(`\n${'─'.repeat(52)}`)

if (ausentes.length > 0) {
  console.log(`! ${ausentes.length} objeto(s) que el código espera y no están en la base:\n`)
  for (const a of ausentes) console.log(`  · ${a}`)
  console.log('\n  No es un fallo de aislamiento: son migraciones sin aplicar en Supabase.\n')
}

if (fallas.length === 0) {
  console.log(`✓ ${pasadas} comprobaciones de aislamiento pasaron.`)
  process.exit(ausentes.length > 0 ? 2 : 0)
}
console.log(`✗ ${fallas.length} falla(s) de ${pasadas + fallas.length} comprobaciones:\n`)
for (const f of fallas) console.log(`  · ${f}`)
process.exit(1)
