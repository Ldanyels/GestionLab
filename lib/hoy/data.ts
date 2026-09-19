import { createServerSupabase } from '@/lib/supabase/server'
import { deudaPorConsultorio } from '@/lib/consultorios/deuda'
import { hoyLima, sinRepetir } from '@/lib/trabajos/agenda'
import { movimientosDelDia, type ConMovimientos } from './movimientos'
import { nombresDeTipo } from '@/lib/trabajos/pagina'
import { veMontos } from '@/lib/permisos'
import type { Perfil } from '@/lib/supabase/types'
import type { TrabajoListItem } from '@/lib/trabajos/types'
import { registrarError } from '@/lib/registro'

export interface ResumenHoy {
  /** Trabajos que ingresaron hoy. Es el contador que se muestra en pantalla. */
  ingresadosHoy: number
  /**
   * Entregas con fecha de hoy. Se mantiene para el contador de la sección de
   * entregas, pero no se muestra como KPI: `fecha_entrega` llega en NULL en
   * todos los trabajos de MasterLab, así que el número era siempre 0.
   */
  entregasHoy: number
  enCurso: number
  porCobrar: number
  /**
   * Prometidas y aún sin entregar, con la fecha ya pasada.
   *
   * Es el único número de esta pantalla que exige una acción: los demás
   * informan, este señala a quién hay que llamar hoy.
   */
  atrasadas: number
}

/*
  Las cifras del resumen ya no se calculan aquí.

  Vivían en una función `resumenHoy` que recorría todos los trabajos en
  memoria. Ahora las calcula `resumen_hoy` en la base, que es donde están los
  datos, y devuelve una sola fila. Se borró la versión en TypeScript en vez de
  dejarla al lado: dos implementaciones de la misma regla acaban discrepando, y
  la que no se ejecuta es la que nadie nota cuando se queda atrás.

  El script de aislamiento comprueba en cada ejecución que lo que devuelve la
  función coincide con el cálculo hecho fila por fila sobre los mismos datos.
*/

export interface FilaDeuda {
  id: string
  nombre: string
  detalle: string
  saldo: number
}

/** Consultorios que más deben, con su detalle legible. Puro. */
export function topDeuda(
  filas: readonly {
    consultorio_id: string
    consultorio: string
    doctores: number
    trabajos: number
    saldo: number
  }[],
  n: number,
): FilaDeuda[] {
  return filas
    .filter((c) => c.saldo > 0.001)
    .slice(0, n)
    .map((c) => ({
      id: c.consultorio_id,
      nombre: c.consultorio,
      detalle: `${c.doctores} doctor${c.doctores === 1 ? '' : 'es'} · ${c.trabajos} trabajo${
        c.trabajos === 1 ? '' : 's'
      }`,
      saldo: c.saldo,
    }))
}

export interface DatosHoy {
  hoy: string
  /** Trabajos que ingresaron hoy: la sección principal de la pantalla. */
  ingresados: TrabajoListItem[]
  /** Entregas con fecha de hoy que siguen en curso, sin repetir las de arriba. */
  entregas: TrabajoListItem[]
  /** Entregas con fecha de hoy ya cerradas o entregadas, sin repetir. */
  realizados: TrabajoListItem[]
  /** Prometidas con la fecha pasada y aún sin entregar, la más vieja primero. */
  atrasados: TrabajoListItem[]
  /**
   * Todo lo que se movió hoy: lo que ingresó, se cerró, se entregó o se cobró,
   * sin importar de qué día sea el trabajo.
   */
  movimientos: ConMovimientos<TrabajoListItem & { cobrado_hoy: number }>[]
  resumen: ResumenHoy
  deuda: FilaDeuda[]
  montos: boolean
}

/**
 * Todo lo que pinta la pantalla Hoy. La deuda solo para quien ve importes.
 * Las dos consultas van en paralelo y la deuda la agrega la base: antes se
 * traía la tabla de trabajos dos veces.
 *
 * La sección principal son los trabajos que **ingresaron** hoy. Antes la
 * pantalla se apoyaba solo en `fecha_entrega`, que llega en NULL en los 18
 * trabajos de MasterLab porque nadie la llena: el resultado era un "Entregas de
 * hoy: 0" permanente y un técnico sin forma de ver el trabajo del día. Las dos
 * listas por fecha de entrega se conservan —el día que empiecen a usarla
 * aparecen solas— y se les quitan los trabajos ya listados arriba para que
 * ninguno salga dos veces.
 */
/**
 * Cuántas filas como mucho de cada lista de la pantalla.
 *
 * Las tres listas están acotadas por naturaleza —lo que entró hoy, lo que se
 * entrega hoy— salvo las atrasadas, que crecen si nadie las resuelve. El tope
 * evita que un laboratorio con doscientas entregas vencidas reciba doscientas
 * tarjetas: las que importan son las primeras, y el resto se ve en Trabajos.
 */
const TOPE_POR_LISTA = 50

/** Las columnas que pinta la tarjeta. Sin `busqueda`, que solo sirve en la base. */
const COLUMNAS =
  'id, laboratorio_id, doctor_id, catalogo_trabajo_id, paciente_nombre, pieza, fecha_ingreso, fecha_entrega, entregado_el, estado, precio_acordado, cantidad, variable_cantidad, notas, creado_en, cerrado_el, doctor_nombre, consultorio_id, consultorio_nombre, total_pagado, saldo'

/**
 * Todo lo que pinta la pantalla Hoy, sin descargar el laboratorio entero.
 *
 * Antes se traían **todos** los trabajos para contar cuatro cifras y repartir
 * tres listas cortas. A 18 trabajos diarios eso son 6.570 filas al año viajando
 * al teléfono cada mañana. Ahora cada lista es su propia consulta acotada y las
 * cifras vienen en una sola fila desde la base.
 *
 * Las consultas van en paralelo: el conjunto tarda lo que la más lenta.
 */
export async function datosHoy(perfil: Perfil | null): Promise<DatosHoy> {
  const hoy = hoyLima()
  const montos = veMontos(perfil)
  const supabase = await createServerSupabase()

  const lista = () => supabase.from('trabajo_listado').select(COLUMNAS)

  const [resumenFila, ingresadosR, entregasR, realizadosR, atrasadosR, cuentas, movidosR, abonosR] =
    await Promise.all([
      supabase.rpc('resumen_hoy', { p_hoy: hoy }).maybeSingle(),
      lista().eq('fecha_ingreso', hoy).order('creado_en', { ascending: false }).limit(TOPE_POR_LISTA),
      lista().eq('fecha_entrega', hoy).eq('estado', 'en_curso').limit(TOPE_POR_LISTA),
      lista()
        .eq('fecha_entrega', hoy)
        .in('estado', ['cerrado', 'entregado'])
        .limit(TOPE_POR_LISTA),
      /*
        Atrasadas: la más vieja primero, que es por la que va a llamar el
        consultorio. Aprovecha el índice parcial de la migración 0026, que
        indexa solo las que tienen fecha y siguen sin entregar.
      */
      lista()
        .lt('fecha_entrega', hoy)
        .not('fecha_entrega', 'is', null)
        .not('estado', 'in', '(entregado,cerrado)')
        .order('fecha_entrega', { ascending: true })
        .limit(TOPE_POR_LISTA),
      montos ? deudaPorConsultorio() : Promise.resolve([]),
      /*
        Los movimientos del día.

        Se piden los trabajos que tienen **alguna** de las tres fechas en hoy y,
        aparte, los que recibieron un abono hoy. Un `or` sobre las tres fechas y
        una consulta corta de abonos: las dos devuelven un puñado de filas,
        porque un laboratorio no mueve cientos de trabajos en un día.
      */
      lista()
        .or(`fecha_ingreso.eq.${hoy},entregado_el.eq.${hoy},cerrado_el.eq.${hoy}`)
        .limit(TOPE_POR_LISTA),
      supabase
        .from('abono')
        .select('trabajo_id, monto')
        .eq('fecha', hoy),
    ])

  /*
    Una consulta que falla se registra; no se convierte en una lista vacía.

    Así se perdió una sección entera: la vista no tenía `cerrado_el`, la
    consulta devolvía `42703` y esto la traducía a «no hay movimientos hoy».
    La pantalla decía «Trabajos de hoy: 9» y justo debajo que no había ninguno,
    y nada en los registros lo delataba.

    Se sigue devolviendo una lista vacía —la pantalla tiene que abrir— pero
    ahora el fallo aparece en el registro de errores y llega el aviso.
  */
  const filas = (r: { data: unknown; error?: { message: string; code?: string } | null }) => {
    if (r.error) registrarError('datosHoy', r.error, 'No se pudo cargar parte de la pantalla')
    return (r.data ?? []) as unknown as TrabajoListItem[]
  }

  /*
    El tipo de trabajo, que es el titular de cada tarjeta.

    La vista no lo trae con formato: guarda los nombres de los tipos dentro del
    campo de búsqueda, sin el «2× Corona + 1× Perno» con el que se leen. Se
    arma con la misma función que la lista de Trabajos, en una consulta por las
    filas que se muestran —a lo sumo cuatro listas cortas.
  */
  const crudos = [
    ...filas(ingresadosR),
    ...filas(entregasR),
    ...filas(realizadosR),
    ...filas(atrasadosR),
  ]
  const nombres = await nombresDeTipo(
    supabase,
    [...new Set(crudos.map((t) => t.id))],
  )
  const conTipo = (lista: TrabajoListItem[]): TrabajoListItem[] =>
    lista.map((t) => ({ ...t, tipo_nombre: nombres.get(t.id) ?? '—' }))

  const ingresados = conTipo(filas(ingresadosR))

  /*
    Si la función de resumen aún no existe, la pantalla abre con las cifras en
    cero en vez de no abrir. Es la misma decisión que en el resto del sistema:
    una migración pendiente no puede dejar sin trabajar a un laboratorio.
  */
  const r = (resumenFila.data ?? null) as {
    ingresados_hoy: number
    entregas_hoy: number
    en_curso: number
    atrasadas: number
    por_cobrar: number
  } | null

  /*
    Los abonos de hoy, sumados por trabajo.

    Dos abonos del mismo trabajo el mismo día son un solo movimiento de cobro
    con la suma, no dos eventos: es un cobro partido.
  */
  const cobradoPorTrabajo = new Map<string, number>()
  // Mismo criterio que arriba: si la consulta de abonos falla, se registra en
  // vez de quedarse callada diciendo que hoy no se cobró nada.
  if (abonosR.error) {
    registrarError('datosHoy.abonos', abonosR.error, 'No se pudieron cargar los cobros de hoy')
  }
  for (const a of ((abonosR.data ?? []) as unknown as { trabajo_id: string; monto: number }[])) {
    cobradoPorTrabajo.set(
      a.trabajo_id,
      Math.round(((cobradoPorTrabajo.get(a.trabajo_id) ?? 0) + Number(a.monto)) * 100) / 100,
    )
  }

  /*
    Se unen los trabajos con fecha de hoy y los que solo recibieron un abono.

    Un trabajo cobrado hoy puede ser de hace semanas y no aparecer en la
    primera consulta; sin esta unión, el movimiento de cobro se perdería justo
    en los trabajos viejos, que son los que más se cobran.
  */
  const movidos = new Map<string, TrabajoListItem & { cobrado_hoy: number }>()
  for (const t of filas(movidosR)) movidos.set(t.id, { ...t, cobrado_hoy: 0 })
  for (const [id, monto] of cobradoPorTrabajo) {
    const ya = movidos.get(id)
    if (ya) ya.cobrado_hoy = monto
  }
  const paraMovimientos = conTipo([...movidos.values()]).map((t) => ({
    ...t,
    cobrado_hoy: movidos.get(t.id)?.cobrado_hoy ?? 0,
    // `cobrado_el` lleva el día si hubo abono: es lo que `movimientosDelDia`
    // compara, y así la regla de qué cuenta como cobro vive en un solo sitio.
    cobrado_el: cobradoPorTrabajo.has(t.id) ? [hoy] : [],
  }))

  return {
    hoy,
    movimientos: movimientosDelDia(paraMovimientos, hoy),
    ingresados,
    atrasados: conTipo(filas(atrasadosR)),
    // `sinRepetir` se mantiene: un trabajo que ingresó hoy y además se entrega
    // hoy saldría dos veces en la pantalla.
    entregas: sinRepetir(conTipo(filas(entregasR)), ingresados),
    realizados: sinRepetir(conTipo(filas(realizadosR)), ingresados),
    resumen: {
      ingresadosHoy: Number(r?.ingresados_hoy ?? 0),
      entregasHoy: Number(r?.entregas_hoy ?? 0),
      enCurso: Number(r?.en_curso ?? 0),
      atrasadas: Number(r?.atrasadas ?? 0),
      porCobrar: Math.round(Number(r?.por_cobrar ?? 0) * 100) / 100,
    },
    deuda: topDeuda(cuentas, 4),
    montos,
  }
}
