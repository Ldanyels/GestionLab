import { listTrabajos } from '@/lib/trabajos/data'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio, soloConSaldo } from '@/lib/reportes/agrupar'
import { entregasDelDia, hoyLima } from '@/lib/trabajos/agenda'
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
  grupos: readonly {
    consultorio_id: string
    consultorio: string
    saldo: number
    doctores: readonly { doctor: string; filas: readonly unknown[] }[]
  }[],
  n: number,
): FilaDeuda[] {
  return grupos
    .filter((g) => g.saldo > 0.001)
    .slice(0, n)
    .map((g) => {
      const trabajos = g.doctores.reduce((s, d) => s + d.filas.length, 0)
      const doctores = g.doctores.map((d) => d.doctor).join(', ')
      return {
        id: g.consultorio_id,
        nombre: g.consultorio,
        detalle: `${doctores} · ${trabajos} trabajo${trabajos === 1 ? '' : 's'}`,
        saldo: g.saldo,
      }
    })
}

export interface DatosHoy {
  hoy: string
  entregas: TrabajoListItem[]
  resumen: ResumenHoy
  deuda: FilaDeuda[]
  montos: boolean
}

/** Todo lo que pinta la pantalla Hoy. La deuda solo para quien ve importes. */
export async function datosHoy(perfil: Perfil | null): Promise<DatosHoy> {
  const hoy = hoyLima()
  const montos = veMontos(perfil)
  const trabajos = await listTrabajos()
  const entregas = entregasDelDia(
    trabajos.filter((t) => t.estado === 'en_curso'),
    hoy,
  )
  const deuda = montos
    ? topDeuda(agruparPorConsultorio(soloConSaldo(await filasReporte())).grupos, 4)
    : []
  return { hoy, entregas, resumen: resumenHoy(trabajos, hoy), deuda, montos }
}
