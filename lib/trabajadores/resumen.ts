/**
 * Cuánto se llevó cada trabajador y qué parte de los ingresos representa.
 *
 * Antes, Finanzas mostraba una sola línea: «Pagos a trabajadores S/900». Eso
 * dice cuánto salió pero no si es mucho, ni a quién, que son las dos preguntas
 * que se hacen al mirarlo.
 */

export interface PagoResumible {
  trabajador_id: string
  /** `null` si el trabajador fue eliminado después de pagarle. */
  trabajador: string | null
  monto: number
}

export interface ManoDeObraPorTrabajador {
  trabajador_id: string
  trabajador: string
  monto: number
  pagos: number
}

export interface ResumenDeManoDeObra {
  porTrabajador: ManoDeObraPorTrabajador[]
  total: number
  /** Qué porcentaje de los ingresos del periodo se fue en mano de obra. */
  porcentajeDeIngresos: number
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

export function resumenDeManoDeObra(
  pagos: readonly PagoResumible[],
  ingresos: number,
): ResumenDeManoDeObra {
  const porId = new Map<string, ManoDeObraPorTrabajador>()

  for (const p of pagos) {
    const existente = porId.get(p.trabajador_id)
    if (existente) {
      existente.monto = r2(existente.monto + p.monto)
      existente.pagos++
    } else {
      porId.set(p.trabajador_id, {
        trabajador_id: p.trabajador_id,
        // El dinero salió aunque el trabajador ya no esté. Omitirlo dejaría el
        // total sin cuadrar con el desglose de gastos y nadie podría explicar
        // la diferencia.
        trabajador: p.trabajador ?? 'Trabajador eliminado',
        monto: r2(p.monto),
        pagos: 1,
      })
    }
  }

  const porTrabajador = [...porId.values()].sort((a, b) => b.monto - a.monto)
  const total = r2(porTrabajador.reduce((s, t) => s + t.monto, 0))

  return {
    porTrabajador,
    total,
    // Sin ingresos el porcentaje es 0: dividir entre cero imprimiría
    // «Infinity%» en el primer mes de un laboratorio nuevo.
    porcentajeDeIngresos: ingresos > 0 ? Math.round((total / ingresos) * 100) : 0,
  }
}
