export interface ResumenFinanciero {
  ingresos: number
  materiales: number
  pagos: number
  gastos: number
  utilidad: number
}

export function armarResumen(input: {
  ingresos: number
  materiales: number
  pagos: number
}): ResumenFinanciero {
  const gastos = input.materiales + input.pagos
  return {
    ...input,
    gastos,
    utilidad: Math.round((input.ingresos - gastos) * 100) / 100,
  }
}

/** Margen sobre ingresos, en % entero. 0 si no hubo ingresos. */
export function margenPct(resumen: ResumenFinanciero): number {
  if (resumen.ingresos <= 0) return 0
  return Math.round((resumen.utilidad / resumen.ingresos) * 100)
}
