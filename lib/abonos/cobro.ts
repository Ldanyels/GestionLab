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
