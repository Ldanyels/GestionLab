/**
 * Un pago de un consultorio repartido entre sus trabajos.
 *
 * El caso real: Arte oral debe S/1.960 en 12 trabajos y yapea S/200 a cuenta.
 * Hasta ahora eso exigía abrir trabajo por trabajo decidiendo cuánto va a cada
 * uno, y por eso hay 4 abonos registrados contra 43 trabajos con saldo.
 *
 * Quién decide el reparto: **el laboratorio, no el sistema**. Se marcan los
 * trabajos que cubre el pago y se puede bajar el importe de cualquiera. El
 * sistema no adivina, porque el consultorio suele decir por qué trabajos está
 * pagando y esa información no está en la base.
 *
 * Aquí solo la aritmética y las reglas. La pantalla las muestra; el servidor
 * las vuelve a comprobar.
 */

export interface LineaDeCobro {
  trabajo_id: string
  /** Lo que ese trabajo debe. Tope del importe de la línea. */
  saldo: number
  monto: number
}

/** Céntimos de un importe, para comparar sin coma flotante. */
function centimos(n: number): number {
  return Math.round(n * 100)
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * El reparto de partida: cada trabajo con su saldo completo.
 *
 * No decide qué está marcado —eso es de la pantalla— solo cuánto propone para
 * cada trabajo cuando se lo marque, que es cobrarlo entero.
 */
export function lineasIniciales(
  trabajos: readonly { trabajo_id: string; saldo: number }[],
): LineaDeCobro[] {
  return trabajos.map((t) => ({ trabajo_id: t.trabajo_id, saldo: t.saldo, monto: r2(t.saldo) }))
}

/** Cuánto suma el pago. Redondeado: sin eso, tres veces 33,33 da 99,99000000000001. */
export function totalDelCobro(lineas: readonly LineaDeCobro[]): number {
  return r2(lineas.reduce((s, l) => s + l.monto, 0))
}

export type Validacion = { ok: true } | { ok: false; error: string }

/**
 * Reglas del reparto.
 *
 * La segunda es la que importa: ninguna línea puede pasar del saldo de su
 * trabajo. Con eso, registrar un pago mayor que la deuda es imposible por
 * construcción —si cada parte está topada, la suma está topada— y no hace falta
 * ninguna comprobación del total.
 */
export function validarCobro(lineas: readonly LineaDeCobro[]): Validacion {
  if (lineas.length === 0) {
    return { ok: false, error: 'Marca al menos un trabajo que cubra este pago' }
  }
  if (lineas.some((l) => !Number.isFinite(l.monto) || l.monto <= 0)) {
    return { ok: false, error: 'Hay un trabajo con un importe vacío o en cero' }
  }
  /*
    Comparado en céntimos, con uno de tolerancia.

    `monto > saldo + 0.01` parece lo mismo y no lo es: en coma flotante
    `33.33 + 0.01` da 33.339999…, así que cobrar «todo» un trabajo cuyo saldo
    salió de una división rebotaría por una diferencia que nadie puede ver ni
    corregir. En enteros la comparación es exacta.
  */
  if (lineas.some((l) => centimos(l.monto) > centimos(l.saldo) + 1)) {
    return { ok: false, error: 'Hay un trabajo con un importe mayor que su saldo' }
  }
  return { ok: true }
}

/** Lo que hace falta saber de un trabajo para decidir si el pago lo cierra. */
export interface LineaLiquidable {
  trabajo_id: string
  saldo: number
  monto: number
  estado: string
}

/**
 * Los trabajos que este pago deja saldados y listos para cerrarse.
 *
 * Un trabajo entregado y cobrado ya no tiene nada pendiente, y hasta ahora
 * había que entrar a cerrarlo a mano: 22 de los trabajos del piloto estaban
 * pagados sin cerrar. Cobrar es el último paso, así que cerrar es su
 * consecuencia.
 *
 * **Solo los entregados.** Un trabajo en curso que se paga por adelantado no
 * está terminado: cerrarlo lo sacaría de la lista del técnico antes de
 * hacerlo, y además descontaría sus insumos del inventario como si ya se
 * hubiera fabricado. Esos se cierran al entregarlos, por el camino de siempre.
 *
 * El saldo se compara en céntimos enteros. `saldo - monto < 0.01` parece lo
 * mismo y no lo es: en coma flotante una resta de importes con decimales deja
 * restos invisibles, y un trabajo cobrado del todo se quedaría sin cerrar por
 * una diferencia que nadie puede ver ni corregir.
 */
export function trabajosQueSeCierran(lineas: readonly LineaLiquidable[]): string[] {
  return lineas
    .filter((l) => l.estado === 'entregado' && centimos(l.monto) >= centimos(l.saldo))
    .map((l) => l.trabajo_id)
}

export const ESTADOS_COBRABLES = ['todos', 'en_curso', 'entregado'] as const
export type EstadoCobrable = (typeof ESTADOS_COBRABLES)[number]

export const ETIQUETA_ESTADO_COBRABLE: Record<EstadoCobrable, string> = {
  todos: 'Todos',
  en_curso: 'En curso',
  entregado: 'Entregados',
}

/** Cualquier valor desconocido en la URL muestra todo: esconder deuda es peor. */
export function resolverEstadoCobrable(valor: string | undefined): EstadoCobrable {
  return (ESTADOS_COBRABLES as readonly string[]).includes(valor ?? '')
    ? (valor as EstadoCobrable)
    : 'todos'
}

/**
 * Separa los trabajos por estado para cobrarlos aparte.
 *
 * El consultorio paga por lo que ya recibió: mezclar en la misma lista lo
 * entregado con lo que aún está en el taller obliga a buscar cuáles son cuáles
 * entre doce líneas, y ese es el momento en que se marca uno de más.
 *
 * Se devuelven también los conteos, y se cuentan **sobre la lista entera**: una
 * pastilla que contara solo lo ya filtrado diría cero en las otras dos y
 * parecería que no hay nada que cobrar ahí.
 */
export function porEstadoCobrable<T extends { estado: string }>(
  trabajos: readonly T[],
  estado: EstadoCobrable,
): { visibles: T[]; conteo: Record<EstadoCobrable, number> } {
  return {
    visibles: estado === 'todos' ? [...trabajos] : trabajos.filter((t) => t.estado === estado),
    conteo: {
      todos: trabajos.length,
      en_curso: trabajos.filter((t) => t.estado === 'en_curso').length,
      entregado: trabajos.filter((t) => t.estado === 'entregado').length,
    },
  }
}

/** Lo que hace falta de un trabajo para situarlo en la cola de cobro. */
export interface Fechable {
  fecha_ingreso: string
  entregado_el: string | null
}

/**
 * La fecha por la que un trabajo entra en la cola de cobro.
 *
 * La de entrega cuando salió, y la de ingreso mientras siga en el taller. Es
 * el día en que empezó a deberse: un trabajo entregado se cobra desde que se
 * entregó, no desde que llegó, y ordenarlos por la fecha de ingreso ponía
 * primero uno que entró en agosto y salió la semana pasada.
 *
 * Los entregados sin fecha sellada —de antes de que el sistema la guardara
 * sola— caen a su ingreso. Es lo único que se sabe de ellos.
 */
export function fechaDeCobro(t: Fechable): string {
  return t.entregado_el ?? t.fecha_ingreso
}

/** «Entregado 2026-09-25» o «Ingresó 2026-09-11», según cuál se esté usando. */
export function etiquetaFechaDeCobro(t: Fechable): string {
  return t.entregado_el ? `Entregado ${t.entregado_el}` : `Ingresó ${t.fecha_ingreso}`
}

/**
 * Del más antiguo al más nuevo por su fecha de cobro.
 *
 * Lo más viejo primero porque es lo que lleva más tiempo sin cobrarse, que es
 * el orden en que se reclama.
 */
export function ordenarParaCobrar<T extends Fechable>(trabajos: readonly T[]): T[] {
  return [...trabajos].sort((a, b) => {
    const fa = fechaDeCobro(a)
    const fb = fechaDeCobro(b)
    return fa === fb ? a.fecha_ingreso.localeCompare(b.fecha_ingreso) : fa.localeCompare(fb)
  })
}
