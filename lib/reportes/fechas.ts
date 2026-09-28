import type { FilaReporte } from './agrupar'

type Fechable = Pick<FilaReporte, 'fecha_ingreso' | 'entregado_el'>

/**
 * Las fechas de un trabajo tal como se leen en un reporte.
 *
 * Ingreso siempre; la entrega detrás de una flecha cuando el trabajo salió.
 * «Entró el 13 y salió el 18» es lo que se quiere saber de un entregado, y el
 * reporte hasta ahora solo decía lo primero.
 *
 * Se mira `entregado_el` y **no el estado**: hay entregados antiguos sin sellar
 * —7 de 53 cuando se escribió esto, de antes de que la fecha se guardara sola—
 * y una flecha hacia la nada no informa de nada.
 *
 * El año de la entrega se calla cuando coincide con el del ingreso, que es lo
 * que haría cualquiera al escribirlo a mano. En el PDF esa diferencia es la que
 * decide si el nombre del trabajo cabe o se corta.
 *
 * @param corto En pantalla las fechas van sin año (`09-13`); en el PDF completas.
 * @param flecha
 *   El PDF usa las fuentes estándar, que solo codifican WinAnsi: una «→»
 *   (U+2192) no se puede ni medir, y el reporte entero falla al generarse en
 *   cuanto aparece un entregado. Por eso el PDF pasa una de ASCII.
 */
export function fechasDeFila(
  f: Fechable,
  { corto = false, flecha = '→' }: { corto?: boolean; flecha?: string } = {},
): string {
  const ingreso = corto ? sinAno(f.fecha_ingreso) : f.fecha_ingreso
  if (!f.entregado_el) return ingreso

  const mismoAno = f.fecha_ingreso.slice(0, 4) === f.entregado_el.slice(0, 4)
  const entrega = corto || mismoAno ? sinAno(f.entregado_el) : f.entregado_el
  return `${ingreso} ${flecha} ${entrega}`
}

function sinAno(fecha: string): string {
  return fecha.slice(5)
}
