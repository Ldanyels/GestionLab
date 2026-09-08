import type { EstadoTrabajo } from './estado'

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
