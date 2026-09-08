export type Rol = 'admin' | 'tecnico'

export interface Laboratorio {
  id: string
  nombre: string
  plan: 'gratis' | 'pagado'
  estado: 'activo' | 'suspendido'
}

export interface Perfil {
  id: string
  laboratorio_id: string
  nombre: string
  rol: Rol
  /** Permisos extra del técnico. El admin los tiene todos implícitamente. */
  permisos: string[]
}
