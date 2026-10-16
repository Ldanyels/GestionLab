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

/**
 * Añade a la serie mensual los gastos de servicios y extras.
 *
 * `finanzas_por_mes` solo suma insumos y pagos al personal: la tabla `gasto`
 * —luz, agua, alquiler, reparaciones— llegó después y la función de la base
 * nunca la incluyó. La gráfica «Ingresos vs gastos» se quedaba corta casi a la
 * mitad: en setiembre decía S/5.120 cuando el gasto real fue S/9.585.
 *
 * Se suma aquí y no en la base por lo mismo que en `resumen`: tocar la función
 * obliga a reemplazarla por migración y a arriesgar las cifras que ya salen
 * bien, y son unas decenas de filas al mes.
 */
export function sumarGastosPorMes<T extends { mes: string; gastos: number }>(
  serie: readonly T[],
  gastos: readonly { fecha: string; monto: number }[],
): T[] {
  const porMes = new Map<string, number>()
  for (const g of gastos) {
    const clave = g.fecha.slice(0, 7)
    porMes.set(clave, (porMes.get(clave) ?? 0) + Number(g.monto))
  }
  return serie.map((p) => ({
    ...p,
    gastos: Math.round((p.gastos + (porMes.get(p.mes.slice(0, 7)) ?? 0)) * 100) / 100,
  }))
}
