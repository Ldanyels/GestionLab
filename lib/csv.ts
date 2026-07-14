type Celda = string | number | null | undefined

function escapar(v: Celda): string {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Construye un CSV (con BOM para que Excel respete los acentos). */
export function construirCsv(headers: string[], filas: Celda[][]): string {
  const lineas = [
    headers.map(escapar).join(','),
    ...filas.map((f) => f.map(escapar).join(',')),
  ]
  return '﻿' + lineas.join('\r\n')
}

export function respuestaCsv(nombreArchivo: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    },
  })
}
