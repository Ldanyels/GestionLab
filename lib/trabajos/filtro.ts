import type { EstadoTrabajo } from './estado'
import { campoFechaDe, filtrarPorFecha, type Rango } from './periodo'

export interface CamposBuscables {
  tipo_nombre: string
  paciente_nombre: string | null
  doctor_nombre: string
  consultorio_nombre: string
}

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Busca en tipo, paciente, doctor y consultorio. Todas las palabras deben coincidir. */
export function filtrarTrabajos<T extends CamposBuscables>(
  lista: readonly T[],
  q: string,
): T[] {
  const tokens = normalizar(q.trim()).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return [...lista]
  return lista.filter((t) => {
    const texto = normalizar(
      `${t.tipo_nombre} ${t.paciente_nombre ?? ''} ${t.doctor_nombre} ${t.consultorio_nombre}`,
    )
    return tokens.every((tok) => texto.includes(tok))
  })
}

export interface ConteoEstados {
  todos: number
  en_curso: number
  cerrado: number
  entregado: number
}

/** Conteo por estado para las pastillas de filtro. */
export function contarPorEstado(
  lista: readonly { estado: EstadoTrabajo }[],
): ConteoEstados {
  const conteo: ConteoEstados = {
    todos: lista.length,
    en_curso: 0,
    cerrado: 0,
    entregado: 0,
  }
  for (const t of lista) conteo[t.estado] += 1
  return conteo
}

type ConEstadoYFechas = {
  estado: EstadoTrabajo
  fecha_ingreso: string
  entregado_el?: string | null
}

/**
 * Conteo por estado cuando además hay un periodo activo.
 *
 * Cada estado se cuenta con **su** fecha, porque cada uno se filtra con su
 * fecha al pulsarlo: los entregados por la de salida, el resto por la de
 * ingreso. Contarlos todos con una sola fecha haría que el número de un botón
 * prometiera resultados que ese botón no devuelve.
 *
 * Consecuencia asumida: con un periodo activo, «Todos» puede no ser la suma de
 * los otros tres —un trabajo entregado puede haber ingresado dentro del rango y
 * salido fuera—. Se prefiere eso a que un número mienta, y con el periodo en
 * «Todo», que es el caso normal, la suma vuelve a cuadrar.
 */
export function contarPorEstadoEnPeriodo(
  lista: readonly ConEstadoYFechas[],
  rango: Rango | null,
): ConteoEstados {
  const cuantos = (estado: EstadoTrabajo) =>
    filtrarPorFecha(
      lista.filter((t) => t.estado === estado),
      rango,
      campoFechaDe(estado),
    ).length

  return {
    todos: filtrarPorFecha(lista, rango, campoFechaDe(null)).length,
    en_curso: cuantos('en_curso'),
    cerrado: cuantos('cerrado'),
    entregado: cuantos('entregado'),
  }
}
