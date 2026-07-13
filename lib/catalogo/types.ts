export interface CatalogoTrabajo {
  id: string
  laboratorio_id: string
  categoria: string
  nombre: string
  precio_base: number
  variable_etiqueta: string | null
  variable_precio_unitario: number | null
  activo: boolean
  creado_en: string
}

export interface PlantillaEtapa {
  id: string
  laboratorio_id: string
  catalogo_trabajo_id: string
  nombre: string
  orden: number
  creado_en: string
}

export interface CatalogoConEtapas extends CatalogoTrabajo {
  etapas: PlantillaEtapa[]
}
