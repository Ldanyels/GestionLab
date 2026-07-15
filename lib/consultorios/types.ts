export interface Consultorio {
  id: string
  laboratorio_id: string
  nombre: string
  contacto: string | null
  notas: string | null
  activo: boolean
  creado_en: string
}

export interface Doctor {
  id: string
  laboratorio_id: string
  consultorio_id: string
  nombre: string
  contacto: string | null
  activo: boolean
  creado_en: string
}

export interface ConsultorioConDoctores extends Consultorio {
  doctores: Doctor[]
}
