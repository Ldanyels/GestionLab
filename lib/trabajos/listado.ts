import type { EstadoTrabajo } from './estado'
import type { FiltroPago } from './pago'
import { campoFechaDe, type Rango } from './periodo'

/**
 * Filtros de la lista de trabajos, aplicados **en la base**.
 *
 * Antes se traía la lista completa y se filtraba en memoria: cómodo mientras
 * eran cincuenta trabajos, insostenible a 18 diarios —0,97 KB por fila, 5,7 MB
 * por pantalla en un año—. La vista `trabajo_listado` expone el saldo y un
 * campo de búsqueda como columnas, y con eso todo el filtrado cabe en la
 * consulta.
 *
 * Este módulo solo **arma** la consulta. No la ejecuta, y por eso se puede
 * comprobar entera sin red ni simulacros: la URL que produce postgrest-js dice
 * exactamente qué filtros se aplicaron.
 */

export const VISTA = 'trabajo_listado'

/** Cuántos trabajos trae cada página. */
export const POR_PAGINA = 30

/** Umbral de deuda, el mismo que usa `tieneSaldo` en memoria. */
const UMBRAL = 0.001

export interface FiltrosDeListado {
  estado: EstadoTrabajo | null
  pago: FiltroPago
  rango: Rango | null
  q: string
}

/**
 * Quita tildes y mayúsculas, igual que hace la vista al construir `busqueda`.
 *
 * Las dos normalizaciones tienen que coincidir o la búsqueda no encontraría
 * nada: si el usuario escribe «Muñoz» y la columna guarda «munoz», el `like`
 * falla. Por eso la vista normaliza al guardar y esto normaliza al preguntar.
 */
export function normalizarBusqueda(q: string): string {
  return q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Lo mínimo que necesita una consulta para poder filtrarse.
 *
 * Se describe aquí en vez de importar el tipo de postgrest-js: ese paquete no
 * es una dependencia directa del proyecto, y depender de su ruta interna
 * rompería el día que Supabase reorganice sus paquetes. Con esto, cualquier
 * constructor que tenga estos métodos encaja —incluido uno de prueba.
 */
export interface Filtrable {
  eq(columna: string, valor: unknown): Filtrable
  gt(columna: string, valor: unknown): Filtrable
  gte(columna: string, valor: unknown): Filtrable
  lte(columna: string, valor: unknown): Filtrable
  like(columna: string, patron: string): Filtrable
  or(filtro: string): Filtrable
}

/**
 * Aplica los filtros a una consulta sobre la vista.
 *
 * Sirve igual para contar —con `head: true`, que no devuelve ninguna fila— y
 * para traer la página. Que sea la misma función es lo que garantiza que el
 * número del contador y la lista que se ve correspondan a lo mismo.
 */
export function aplicarFiltros<T>(consulta: T, f: FiltrosDeListado): T {
  /*
    La conversión vive aquí dentro y en un solo sitio.

    El constructor de postgrest-js tiene tipos genéricos por columna que no
    encajan con una interfaz escrita a mano, pero sí tiene estos métodos. Al
    confinar la conversión, quien llama conserva el tipo real de su consulta y
    puede seguir encadenando `.order()` o leer `.error` después.
  */
  let q = consulta as unknown as Filtrable

  if (f.estado) q = q.eq('estado', f.estado)

  /*
    El periodo acota por la fecha que corresponde al estado: los entregados por
    su fecha real de salida, el resto por la de ingreso. Es la misma regla que
    `campoFechaDe` aplicaba en memoria, y se mantiene aquí para que las
    pastillas de filtro sigan contando lo que devuelven.
  */
  if (f.rango) {
    const campo = campoFechaDe(f.estado)
    if (campo === 'entregado_el') {
      /*
        Los entregados sin fecha real también cuentan.

        Son los anteriores a la migración 0019, cuando esa fecha no se
        registraba: excluirlos haría desaparecer trabajos que sí existen, y ya
        pasó —al filtrar «entregados» salían 4 de 16.
      */
      q = q.or(
        `entregado_el.is.null,and(entregado_el.gte.${f.rango.desde},entregado_el.lte.${f.rango.hasta})`,
      )
    } else {
      q = q.gte(campo, f.rango.desde).lte(campo, f.rango.hasta)
    }
  }

  if (f.pago === 'por_cobrar') q = q.gt('saldo', UMBRAL)
  if (f.pago === 'pagados') q = q.lte('saldo', UMBRAL)

  const texto = normalizarBusqueda(f.q)
  if (texto) {
    /*
      Todas las palabras deben coincidir, en cualquier orden: un `like` por cada
      una. Con «arte ruiz» se busca a la doctora Ruiz de Arte oral, no todo lo
      que tenga «arte» o «ruiz», que devolvería media lista.
    */
    for (const palabra of texto.split(/\s+/).filter(Boolean)) {
      // Las comas y los paréntesis rompen la sintaxis de filtros de PostgREST;
      // se quitan en vez de escaparlas, porque en una búsqueda no aportan nada.
      q = q.like('busqueda', `%${palabra.replace(/[,()*]/g, '')}%`)
    }
  }

  return q as unknown as T
}

/** El rango de filas de una página, para `.range()`. */
export function rangoDePagina(pagina: number, porPagina = POR_PAGINA): [number, number] {
  // Página 1 o menor empieza en cero: una URL manipulada a mano no debe pedir
  // filas negativas, que PostgREST rechaza con un error que nadie entiende.
  const p = Math.max(1, Math.floor(pagina))
  const desde = (p - 1) * porPagina
  return [desde, desde + porPagina - 1]
}

/** Cuántas páginas hay para un total. Al menos una, aunque esté vacía. */
export function totalDePaginas(total: number, porPagina = POR_PAGINA): number {
  return Math.max(1, Math.ceil(total / porPagina))
}
