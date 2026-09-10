import { listTrabajos } from '@/lib/trabajos/data'
import { deudaPorConsultorio } from '@/lib/consultorios/deuda'
import {
  hoyLima,
  ingresadosDelDia,
  pendientesDelDia,
  realizadosDelDia,
  sinRepetir,
} from '@/lib/trabajos/agenda'
import { estadoDeEntrega } from '@/lib/trabajos/plazo'
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

/** KPIs de la pantalla Hoy. Puro. */
export function resumenHoy(
  trabajos: readonly {
    estado: string
    fecha_ingreso: string
    fecha_entrega: string | null
    saldo: number
  }[],
  hoy: string,
): ResumenHoy {
  return {
    ingresadosHoy: trabajos.filter((t) => t.fecha_ingreso === hoy).length,
    entregasHoy: trabajos.filter((t) => t.fecha_entrega === hoy).length,
    enCurso: trabajos.filter((t) => t.estado === 'en_curso').length,
    porCobrar:
      Math.round(trabajos.reduce((s, t) => s + Math.max(0, t.saldo), 0) * 100) / 100,
    atrasadas: trabajos.filter((t) => estadoDeEntrega(t, hoy) === 'atrasada').length,
  }
}

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
export async function datosHoy(perfil: Perfil | null): Promise<DatosHoy> {
  const hoy = hoyLima()
  const montos = veMontos(perfil)
  const [trabajos, cuentas] = await Promise.all([
    listTrabajos(),
    montos ? deudaPorConsultorio() : Promise.resolve([]),
  ])
  const ingresados = ingresadosDelDia(trabajos, hoy)
  /*
    Las atrasadas NO se quitan de las otras listas con `sinRepetir`.

    Un trabajo atrasado que además ingresó hoy es imposible salvo con plazo
    cero, y si ocurriera es mejor que salga dos veces: en la sección del día
    porque entró hoy, y en el aviso porque hay que entregarlo. Esconderlo del
    aviso por estar listado más arriba es cómo se pierde de vista.
  */
  const atrasados = trabajos
    .filter((t) => estadoDeEntrega(t, hoy) === 'atrasada')
    .sort((a, b) => (a.fecha_entrega ?? '').localeCompare(b.fecha_entrega ?? ''))
  return {
    hoy,
    ingresados,
    atrasados,
    entregas: sinRepetir(pendientesDelDia(trabajos, hoy), ingresados),
    realizados: sinRepetir(realizadosDelDia(trabajos, hoy), ingresados),
    resumen: resumenHoy(trabajos, hoy),
    deuda: topDeuda(cuentas, 4),
    montos,
  }
}
