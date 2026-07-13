import { getSessionContext } from '@/lib/auth'

/** Id del laboratorio del usuario autenticado (para escrituras). */
export async function laboratorioIdActual(): Promise<string> {
  const { perfil } = await getSessionContext()
  if (!perfil) throw new Error('Sesión sin perfil')
  return perfil.laboratorio_id
}
