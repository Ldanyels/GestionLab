import { CATEGORIAS_GASTO, type CategoriaGasto } from './categorias'

/**
 * El resumen de gastos que se lee en Finanzas.
 *
 * Agrupa dos veces: por categoría, para saber en qué se va el dinero, y por
 * concepto dentro de cada una, porque la pregunta real de un laboratorio no es
 * «cuánto gasté en servicios» sino «cuánto me está costando la luz».
 */

export interface GastoResumible {
  categoria: CategoriaGasto
  concepto: string
  monto: number
}

export interface LineaDeGasto {
  categoria: CategoriaGasto
  concepto: string
  monto: number
  /** Cuántos gastos se sumaron en esta línea. Dos recibos de luz son «2». */
  veces: number
}

export interface ResumenDeGastos {
  porCategoria: Record<CategoriaGasto, number>
  detalle: LineaDeGasto[]
  total: number
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Para unir «Luz», «luz» y « Luz ». Sin tildes no: «Teléfono» y «Telefono» son distintos de escribir, no de significar — pero unificar acentos escondería erratas reales. */
function clave(categoria: string, concepto: string): string {
  return `${categoria}\u241f${concepto.trim().toLowerCase()}`
}

export function resumenDeGastos(gastos: readonly GastoResumible[]): ResumenDeGastos {
  const porCategoria: Record<CategoriaGasto, number> = { servicio: 0, equipo: 0, otro: 0 }
  const lineas = new Map<string, LineaDeGasto>()

  for (const g of gastos) {
    porCategoria[g.categoria] = r2(porCategoria[g.categoria] + g.monto)

    const k = clave(g.categoria, g.concepto)
    const existente = lineas.get(k)
    if (existente) {
      existente.monto = r2(existente.monto + g.monto)
      existente.veces++
    } else {
      // Se guarda la escritura de la primera aparición: «Luz» se lee mejor que
      // «luz» en un resumen, y la normalizada solo sirve para agrupar.
      lineas.set(k, {
        categoria: g.categoria,
        concepto: g.concepto.trim(),
        monto: r2(g.monto),
        veces: 1,
      })
    }
  }

  /*
    Orden fijo de categorías y, dentro, de mayor a menor.

    Por importe y no alfabético: lo que más cuesta es lo que hay que mirar, y
    en una lista alfabética el gasto grande puede quedar al final.
  */
  const detalle = [...lineas.values()].sort((a, b) => {
    const porCat = CATEGORIAS_GASTO.indexOf(a.categoria) - CATEGORIAS_GASTO.indexOf(b.categoria)
    return porCat !== 0 ? porCat : b.monto - a.monto
  })

  return {
    porCategoria,
    detalle,
    total: r2(detalle.reduce((s, l) => s + l.monto, 0)),
  }
}
