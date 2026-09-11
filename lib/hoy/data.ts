import { createServerSupabase } from '@/lib/supabase/server'
import { deudaPorConsultorio } from '@/lib/consultorios/deuda'
import { hoyLima, sinRepetir } from '@/lib/trabajos/agenda'
import { veMontos } from '@/lib/permisos'
import type { Perfil } from '@/lib/supabase/types'
import type { TrabajoListItem } from '@/lib/trabajos/types'

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
  'id, laboratorio_id, doctor_id, catalogo_trabajo_id, paciente_nombre, pieza, fecha_ingreso, fecha_entrega, entregado_el, estado, precio_acordado, cantidad, variable_cantidad, notas, creado_en, doctor_nombre, consultorio_id, consultorio_nombre, total_pagado, saldo'

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

  const [resumenFila, ingresadosR, entregasR, realizadosR, atrasadosR, cuentas] =
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
    ])

  const filas = (r: { data: unknown }) => (r.data ?? []) as unknown as TrabajoListItem[]
  const ingresados = filas(ingresadosR)

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

  return {
    hoy,
    ingresados,
    atrasados: filas(atrasadosR),
    // `sinRepetir` se mantiene: un trabajo que ingresó hoy y además se entrega
    // hoy saldría dos veces en la pantalla.
    entregas: sinRepetir(filas(entregasR), ingresados),
    realizados: sinRepetir(filas(realizadosR), ingresados),
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
