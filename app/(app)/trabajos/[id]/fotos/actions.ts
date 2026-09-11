'use server'

import { revalidatePath } from 'next/cache'
import { intentar, intentarSinEstado } from '@/lib/acciones'
import { laboratorioIdActual } from '@/lib/tenant'
import { eliminarFoto, reservarFoto, siguienteHueco } from '@/lib/fotos/data'
import { esMomento, rutaDeFoto } from '@/lib/fotos/reglas'

export interface ReservaState {
  error: string
  /** Dónde debe subir el navegador. Vacío si no se reservó nada. */
  ruta: string
  /** Id de la fila, para poder soltarla si la subida falla. */
  fotoId: string
}

/**
 * Reserva la posición de una foto y dice dónde subirla.
 *
 * El archivo **no pasa por aquí**: va del navegador directo a Supabase. Vercel
 * limita el cuerpo de una petición a 4,5 MB y cobra por el ancho de banda que
 * lo atraviesa; esquivarlo es gratis y además más rápido para quien sube desde
 * el taller.
 *
 * Lo que sí pasa por el servidor es la decisión de si cabe otra foto, porque el
 * tope de dos por momento está en el contrato de encargo y no puede depender de
 * lo que diga el navegador.
 */
export async function reservarFotoAction(
  _prev: ReservaState,
  formData: FormData,
): Promise<ReservaState> {
  const trabajoId = String(formData.get('trabajo_id') ?? '')
  const momento = String(formData.get('momento') ?? '')
  if (!trabajoId || !esMomento(momento)) {
    return { error: 'Falta el trabajo o el momento', ruta: '', fotoId: '' }
  }

  const r = await intentar('reservarFotoAction', 'No se pudo preparar la foto', async () => {
    const orden = await siguienteHueco(trabajoId, momento)
    if (orden === null) {
      return { orden: null as number | null, ruta: '', id: '' }
    }
    const laboratorioId = await laboratorioIdActual()
    // Sufijo aleatorio: al reemplazar una foto cambia el nombre, así que el
    // navegador no sigue mostrando la anterior desde su caché.
    const ruta = rutaDeFoto(
      laboratorioId,
      trabajoId,
      momento,
      orden,
      crypto.randomUUID().slice(0, 8),
    )
    const id = await reservarFoto(trabajoId, momento, ruta, orden)
    return { orden, ruta, id }
  })

  if (!r.ok) return { error: r.estado.error, ruta: '', fotoId: '' }
  if (r.valor.orden === null) {
    return { error: 'Ya hay dos fotos en ese momento. Borra una para subir otra.', ruta: '', fotoId: '' }
  }

  revalidatePath(`/trabajos/${trabajoId}`)
  return { error: '', ruta: r.valor.ruta, fotoId: r.valor.id }
}

/**
 * Elimina una foto: el archivo y su fila.
 *
 * También se usa cuando la subida falla después de haber reservado la posición.
 * Sin eso, una subida interrumpida dejaría la posición ocupada por una foto que
 * no existe y nadie podría volver a usarla.
 */
export async function eliminarFotoAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const trabajoId = String(formData.get('trabajo_id') ?? '')
  if (!id) return

  await intentarSinEstado('eliminarFotoAction', 'No se pudo eliminar la foto', () =>
    eliminarFoto(id),
  )

  if (trabajoId) revalidatePath(`/trabajos/${trabajoId}`)
}
