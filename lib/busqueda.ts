/**
 * Búsqueda por texto libre, compartida por los selectores con buscador.
 *
 * Vive fuera de cualquier dominio porque la usan dos que no se conocen: el
 * catálogo de tipos de trabajo y la lista de doctores. Antes había una sola
 * copia en el catálogo, y duplicarla habría dejado dos formas distintas de
 * tratar las tildes en dos buscadores de la misma pantalla.
 */

/**
 * Quita tildes y mayúsculas.
 *
 * Sin esto, «Muñoz» no se encuentra escribiendo «munoz», que es como lo escribe
 * quien tiene prisa —y este buscador existe precisamente para quien tiene
 * prisa.
 */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * ¿El texto contiene **todas** las palabras buscadas?
 *
 * Todas y no alguna: al escribir «arte ruiz» se busca a la doctora Ruiz del
 * consultorio Arte oral, no todo lo que tenga «arte» **o** «ruiz», que con
 * treinta y nueve doctores devuelve media lista.
 *
 * Las palabras pueden aparecer en cualquier orden, porque nadie sabe si el
 * sistema guarda «consultorio — doctor» o al revés.
 */
export function coincideConTodas(texto: string, q: string): boolean {
  const tokens = normalizar(q.trim()).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  const base = normalizar(texto)
  return tokens.every((t) => base.includes(t))
}
