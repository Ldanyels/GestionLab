import type { LaboratorioFila } from '../laboratorios'

/**
 * Un laboratorio de ejemplo para las pruebas.
 *
 * Existe porque `LaboratorioFila` ha crecido tres veces —datos fiscales,
 * condiciones de cobro— y cada vez había que parchear el mismo objeto en varios
 * archivos de prueba. Con un solo constructor, añadir un campo se arregla en un
 * sitio.
 */
export function laboratorioDePrueba(p: Partial<LaboratorioFila> = {}): LaboratorioFila {
  return {
    id: 'l1',
    nombre: 'MasterLab',
    plan: 'gratis',
    estado: 'activo',
    creado_en: '2026-07-15T00:00:00Z',
    usuarios: 4,
    trabajos: 29,
    doc_tipo: 'RUC',
    doc_numero: '20512345678',
    razon_social: 'Laboratorio MasterLab E.I.R.L.',
    direccion_fiscal: null,
    periodicidad: null,
    precio_cuota: null,
    inicio_cobro: null,
    ...p,
  }
}
