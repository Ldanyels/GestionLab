import { coincideConTodas } from '@/lib/busqueda'

/**
 * Filtra doctores por texto libre: busca en el nombre y en el consultorio.
 *
 * Los dos campos juntos porque así es como se piensa en ellos —«el de Arte
 * oral»— y porque el selector los muestra juntos. Buscar solo por nombre
 * obligaría a recordar cuál de los treinta y nueve doctores pertenece a qué
 * consultorio.
 */
export function filtrarDoctores<
  T extends { nombre: string; consultorio_nombre: string },
>(doctores: readonly T[], q: string): T[] {
  return doctores.filter((d) => coincideConTodas(`${d.consultorio_nombre} ${d.nombre}`, q))
}
