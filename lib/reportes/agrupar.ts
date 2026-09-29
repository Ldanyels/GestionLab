export interface FilaReporte {
  id: string
  fecha_ingreso: string
  entregado_el: string | null
  estado: string
  paciente: string | null
  resumen: string
  total: number
  pagado: number
  doctor_id: string
  doctor: string
  consultorio_id: string
  consultorio: string
}

export interface GrupoDoctor {
  doctor_id: string
  doctor: string
  filas: FilaReporte[]
  facturado: number
  pagado: number
  saldo: number
}

export interface GrupoConsultorio {
  consultorio_id: string
  consultorio: string
  doctores: GrupoDoctor[]
  facturado: number
  pagado: number
  saldo: number
}

export interface TotalesReporte {
  trabajos: number
  facturado: number
  pagado: number
  saldo: number
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Saldo pendiente de una fila (lo facturado menos lo abonado). */
export function saldoFila(f: Pick<FilaReporte, 'total' | 'pagado'>): number {
  return r2(f.total - f.pagado)
}

/** Solo los trabajos con saldo pendiente (para reportes de cobranza). */
export function soloConSaldo(filas: readonly FilaReporte[]): FilaReporte[] {
  return filas.filter((f) => saldoFila(f) > 0.001)
}

/**
 * Orden cronológico por la fecha que se ve en el reporte: la de entrega.
 *
 * Los que todavía no han salido van al final, ordenados entre sí por su
 * ingreso. Intercalarlos por la fecha de entrada dejaría filas con «—» en medio
 * de una columna de fechas ordenada, que se lee como un fallo.
 *
 * Las fechas son ISO, así que comparar sus cadenas ya es comparar días.
 */
export function porFechaDeEntrega(a: FilaReporte, b: FilaReporte): number {
  if (a.entregado_el && b.entregado_el) {
    return a.entregado_el === b.entregado_el
      ? a.fecha_ingreso.localeCompare(b.fecha_ingreso)
      : a.entregado_el.localeCompare(b.entregado_el)
  }
  if (a.entregado_el) return -1
  if (b.entregado_el) return 1
  return a.fecha_ingreso.localeCompare(b.fecha_ingreso)
}

/**
 * Agrupa trabajos por consultorio → doctor con subtotales de facturado,
 * pagado y saldo. Grupos ordenados por saldo descendente (quién debe más).
 */
export function agruparPorConsultorio(filas: readonly FilaReporte[]): {
  grupos: GrupoConsultorio[]
  totales: TotalesReporte
} {
  const consultorios = new Map<string, GrupoConsultorio>()

  for (const f of filas) {
    let c = consultorios.get(f.consultorio_id)
    if (!c) {
      c = {
        consultorio_id: f.consultorio_id,
        consultorio: f.consultorio,
        doctores: [],
        facturado: 0,
        pagado: 0,
        saldo: 0,
      }
      consultorios.set(f.consultorio_id, c)
    }
    let d = c.doctores.find((x) => x.doctor_id === f.doctor_id)
    if (!d) {
      d = {
        doctor_id: f.doctor_id,
        doctor: f.doctor,
        filas: [],
        facturado: 0,
        pagado: 0,
        saldo: 0,
      }
      c.doctores.push(d)
    }
    d.filas.push(f)
    d.facturado = r2(d.facturado + f.total)
    d.pagado = r2(d.pagado + f.pagado)
    d.saldo = r2(d.facturado - d.pagado)
    c.facturado = r2(c.facturado + f.total)
    c.pagado = r2(c.pagado + f.pagado)
    c.saldo = r2(c.facturado - c.pagado)
  }

  const grupos = [...consultorios.values()].sort((a, b) => b.saldo - a.saldo)
  for (const g of grupos) {
    g.doctores.sort((a, b) => b.saldo - a.saldo)
    // Los grupos siguen ordenados por deuda —a quién hay que llamar primero—;
    // dentro de cada uno, los trabajos van por fecha.
    for (const d of g.doctores) d.filas.sort(porFechaDeEntrega)
  }

  const totales = grupos.reduce<TotalesReporte>(
    (t, g) => ({
      trabajos: t.trabajos,
      facturado: r2(t.facturado + g.facturado),
      pagado: r2(t.pagado + g.pagado),
      saldo: r2(t.saldo + g.saldo),
    }),
    { trabajos: filas.length, facturado: 0, pagado: 0, saldo: 0 },
  )

  return { grupos, totales }
}
