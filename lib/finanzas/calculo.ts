export interface ResumenFinanciero {
  ingresos: number
  materiales: number
  pagos: number
  /**
   * Gastos de operación: servicios, equipo y otros.
   *
   * Hasta que existió esta línea, la utilidad que mostraba el sistema no
   * restaba la luz, el agua ni el alquiler. No era un error de cálculo: era un
   * gasto que no se podía registrar en ninguna parte, y el resultado era una
   * utilidad inflada mes tras mes.
   */
  operativos: number
  gastos: number
  utilidad: number
}

export function armarResumen(input: {
  ingresos: number
  materiales: number
  pagos: number
  /** Opcional para no romper a quien aún no los pasa; cuenta como cero. */
  operativos?: number
}): ResumenFinanciero {
  const operativos = input.operativos ?? 0
  const gastos = Math.round((input.materiales + input.pagos + operativos) * 100) / 100
  return {
    ingresos: input.ingresos,
    materiales: input.materiales,
    pagos: input.pagos,
    operativos,
    gastos,
    utilidad: Math.round((input.ingresos - gastos) * 100) / 100,
  }
}

/** Margen sobre ingresos, en % entero. 0 si no hubo ingresos. */
export function margenPct(resumen: ResumenFinanciero): number {
  if (resumen.ingresos <= 0) return 0
  return Math.round((resumen.utilidad / resumen.ingresos) * 100)
}
