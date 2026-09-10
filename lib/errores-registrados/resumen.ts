/**
 * Cómo se ordena y se resume el registro de errores.
 *
 * Toda la aritmética está aquí, separada de la pantalla y de la base, porque es
 * lo único de esta función que puede estar mal de una forma que nadie note: una
 * lista mal ordenada sigue pareciendo una lista correcta.
 */

export interface ErrorResumible {
  veces: number
  ultima_vez: string
  laboratorios: readonly string[]
  resuelto_el: string | null
}

const UN_MINUTO = 60_000
const UNA_HORA = 60 * UN_MINUTO
const UN_DIA = 24 * UNA_HORA

/**
 * Cuánto hace, en palabras.
 *
 * En este panel importa más «hace 3 minutos» que la hora exacta: la pregunta
 * que se le hace a la pantalla es «¿está pasando ahora?».
 */
export function hace(iso: string, ahora: string): string {
  // Nunca negativo: un reloj desajustado no debe imprimir «hace -3 min», que
  // parece un fallo del propio registro y hace desconfiar del resto.
  const ms = Math.max(0, new Date(ahora).getTime() - new Date(iso).getTime())

  if (ms < UN_MINUTO) return 'ahora mismo'
  if (ms < UNA_HORA) return `hace ${Math.floor(ms / UN_MINUTO)} min`
  if (ms < UN_DIA) {
    const horas = Math.floor(ms / UNA_HORA)
    return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
  }
  const dias = Math.floor(ms / UN_DIA)
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`
}

/**
 * Qué mirar primero.
 *
 * El criterio es **a cuánta gente le está pasando ahora**, no cuántas veces
 * ocurrió. Ordenar por cantidad pondría arriba un error que se disparó cien
 * veces en un bucle de un laboratorio el mes pasado, y dejaría abajo el que
 * hoy le impide facturar a tres.
 *
 * Por eso el alcance —cuántos laboratorios— pesa mucho, la frescura decae con
 * el tiempo, y la cantidad de repeticiones entra en logaritmo: distingue 2 de
 * 200 sin permitir que 200 tape todo lo demás.
 *
 * Un error resuelto vale 0 y se va al final. No desaparece: si vuelve a
 * ocurrir, la base lo reabre y sube solo.
 */
export function urgencia(e: ErrorResumible, ahora: string): number {
  if (e.resuelto_el) return 0

  const horas = Math.max(0, new Date(ahora).getTime() - new Date(e.ultima_vez).getTime()) / UNA_HORA
  const frescura = 1 / (1 + horas / 24)
  // Mínimo 1: un error sin laboratorio identificado no es un error sin
  // importancia, es uno que ocurrió antes de saber quién lo sufría.
  const alcance = Math.max(1, e.laboratorios.length)

  return alcance * 10 * frescura + Math.log10(Math.max(1, e.veces))
}

export interface ResumenDeErrores {
  /** Tipos de error abiertos, no ocurrencias. */
  sinResolver: number
  /** De esos, los que ocurrieron en las últimas 24 horas. */
  delDia: number
  /** Laboratorios distintos con algún error abierto. */
  laboratoriosAfectados: number
}

/**
 * Las tres cifras de la cabecera.
 *
 * Cuenta **tipos**, no ocurrencias: «43 errores» no dice nada útil si son todos
 * el mismo, y decir «2 problemas, uno le pasa a 3 laboratorios» sí.
 */
export function resumenDeErrores(
  errores: readonly ErrorResumible[],
  ahora: string,
): ResumenDeErrores {
  const limite = new Date(ahora).getTime() - UN_DIA
  const afectados = new Set<string>()
  let sinResolver = 0
  let delDia = 0

  for (const e of errores) {
    if (e.resuelto_el) continue
    sinResolver++
    if (new Date(e.ultima_vez).getTime() >= limite) delDia++
    for (const lab of e.laboratorios) afectados.add(lab)
  }

  return { sinResolver, delDia, laboratoriosAfectados: afectados.size }
}
