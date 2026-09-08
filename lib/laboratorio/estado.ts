/**
 * Estado de la cuenta del laboratorio.
 *
 * `laboratorio.estado` existe en la base desde la migración 0001 pero no se
 * leía en ninguna parte, así que no había forma de cortarle el acceso a un
 * laboratorio moroso. Esto es lo que lo hace efectivo.
 */

/** Lo mínimo que hace falta saber del laboratorio para decidir el acceso. */
export interface EstadoDeCuenta {
  estado?: string | null
}

/**
 * ¿Está suspendida la cuenta?
 *
 * Solo devuelve `true` ante un `'suspendido'` explícito. Si el laboratorio no
 * se pudo leer, o su estado viene vacío o con un valor que no reconocemos, la
 * respuesta es `false`: se deja entrar.
 *
 * Es una decisión deliberada, no un descuido. Los dos fallos posibles no
 * cuestan lo mismo: dejar entrar de más a un laboratorio moroso cuesta unos
 * días de servicio, mientras que dejar fuera a uno que paga le detiene el
 * taller. Y en este proyecto ya pasó: un fallo de lectura por una migración
 * pendiente dejó a todos fuera con un mensaje engañoso.
 */
export function estaSuspendido(lab: EstadoDeCuenta | null | undefined): boolean {
  return lab?.estado?.trim().toLowerCase() === 'suspendido'
}

export function puedeUsarElSistema(lab: EstadoDeCuenta | null | undefined): boolean {
  return !estaSuspendido(lab)
}
