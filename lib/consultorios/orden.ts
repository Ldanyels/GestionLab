/**
 * Orden de la lista de doctores: por consultorio y, dentro, por doctor.
 *
 * Un laboratorio piensa por consultorio —«los de Arte oral»— y no por apellido.
 * Ordenar solo por doctor deja los grupos salteados y obliga a recorrer los
 * treinta y nueve para ver quién es de dónde.
 */

/**
 * Comparador en español.
 *
 * `localeCompare('es')` y no el `<` de JavaScript: ese compara por código de
 * carácter, donde «Ñandú» cae después de «Zeta» y «Ábaco» después de todo el
 * alfabeto. Con `sensitivity: 'base'` las mayúsculas y las tildes no alteran la
 * posición de la letra, que es como se ordena una lista a mano.
 */
function comparar(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' })
}

export function ordenarPorConsultorio<
  T extends { nombre: string; consultorio_nombre: string },
>(doctores: readonly T[]): T[] {
  return [...doctores].sort((a, b) => {
    const porConsultorio = comparar(a.consultorio_nombre, b.consultorio_nombre)
    return porConsultorio !== 0 ? porConsultorio : comparar(a.nombre, b.nombre)
  })
}
