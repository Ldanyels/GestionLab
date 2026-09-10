import { after } from 'next/server'
import { getSessionContext } from '@/lib/auth'
import { configurarDestino, type EntradaDeRegistro } from '@/lib/registro'
import { anotarError } from './data'

/**
 * Conecta `registrarError` con la tabla de errores.
 *
 * Se instala una sola vez, desde `instrumentation.ts`. El registro no importa
 * este módulo: al contrario, este módulo le entrega un destino. Así
 * `lib/registro.ts` sigue sin saber nada de Supabase y se puede seguir usando
 * en pruebas sin base de datos.
 */

/**
 * A qué laboratorio le pasó, si se puede saber.
 *
 * `getSessionContext` está memoizado por petición, así que en el caso normal
 * esto no cuesta ninguna consulta: la sesión ya se resolvió al renderizar el
 * layout.
 *
 * Devuelve `null` sin quejarse cuando no hay sesión o cuando las cookies no
 * están disponibles en este contexto. Perder la atribución es aceptable;
 * perder el error, no.
 */
async function laboratorioDeLaSesion(): Promise<string | null> {
  try {
    const { perfil } = await getSessionContext()
    return perfil?.laboratorio_id ?? null
  } catch {
    return null
  }
}

function escribir(entrada: EntradaDeRegistro): void {
  // La consola siempre, además de la base. Si lo que está roto es justamente la
  // conexión con Supabase, el log de Vercel es lo único que queda.
  console.error(`[${entrada.donde}] ${entrada.codigo ?? 'sin-codigo'}: ${entrada.mensaje}`)

  const guardar = async () => {
    await anotarError({
      donde: entrada.donde,
      mensaje: entrada.mensaje,
      codigo: entrada.codigo,
      laboratorioId: entrada.laboratorioId ?? (await laboratorioDeLaSesion()),
    })
  }

  /*
    `after` en vez de lanzar la promesa y olvidarla.

    Escribir el error no puede hacer esperar al usuario, pero en una función sin
    servidor una promesa suelta se puede quedar a medias cuando la respuesta ya
    salió y la función se congela: se perderían justo los errores de los que hay
    que enterarse. `after` mantiene la función viva hasta que termine, y corre
    incluso si la acción lanzó o redirigió.

    Fuera de una petición —una prueba, un script— `after` lanza; ahí se escribe
    directo, que en ese contexto sí es seguro.
  */
  try {
    after(guardar)
  } catch {
    void guardar()
  }
}

export function instalarDestinoDeErrores(): void {
  configurarDestino(escribir)
}
