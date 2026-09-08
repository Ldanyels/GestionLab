import { listTrabajos } from '@/lib/trabajos/data'
import { deudaPorConsultorio } from '@/lib/consultorios/deuda'
import { hoyLima, pendientesDelDia, realizadosDelDia } from '@/lib/trabajos/agenda'
import { veMontos } from '@/lib/permisos'
import type { Perfil } from '@/lib/supabase/types'
import type { TrabajoListItem } from '@/lib/trabajos/types'

export interface ResumenHoy {
  entregasHoy: number
  enCurso: number
  porCobrar: number
}

/** KPIs de la pantalla Hoy. Puro. */
export function resumenHoy(
  trabajos: readonly { estado: string; fecha_entrega: string | null; saldo: number }[],
  hoy: string,
): ResumenHoy {
  return {
    entregasHoy: trabajos.filter((t) => t.fecha_entrega === hoy).length,
    enCurso: trabajos.filter((t) => t.estado === 'en_curso').length,
    porCobrar:
      Math.round(trabajos.reduce((s, t) => s + Math.max(0, t.saldo), 0) * 100) / 100,
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
  /** Entregas de hoy que siguen en curso: lo que queda por hacer. */
  entregas: TrabajoListItem[]
  /** Entregas de hoy ya cerradas o entregadas: la producción de la jornada. */
  realizados: TrabajoListItem[]
  resumen: ResumenHoy
  deuda: FilaDeuda[]
  montos: boolean
}

/**
 * Todo lo que pinta la pantalla Hoy. La deuda solo para quien ve importes.
 * Las dos consultas van en paralelo y la deuda la agrega la base: antes se
 * traía la tabla de trabajos dos veces.
 *
 * Las entregas del día se reparten en dos listas. Antes solo se mostraban las
 * que estaban en curso, así que al marcar un trabajo como cerrado o entregado
 * desaparecía de la pantalla y el técnico no podía ver lo que había hecho, pese
 * a que el contador de "Entregas de hoy" seguía incluyéndolo.
 */
export async function datosHoy(perfil: Perfil | null): Promise<DatosHoy> {
  const hoy = hoyLima()
  const montos = veMontos(perfil)
  const [trabajos, cuentas] = await Promise.all([
    listTrabajos(),
    montos ? deudaPorConsultorio() : Promise.resolve([]),
  ])
  return {
    hoy,
    entregas: pendientesDelDia(trabajos, hoy),
    realizados: realizadosDelDia(trabajos, hoy),
    resumen: resumenHoy(trabajos, hoy),
    deuda: topDeuda(cuentas, 4),
    montos,
  }
}
