import type { Instrumentation } from 'next'

/**
 * Instrumentación del servidor.
 *
 * Dos cosas, y las dos apuntan al mismo sitio: enterarse de que algo se rompió
 * antes de que un laboratorio llame por teléfono.
 *
 * 1. `register` conecta `registrarError` con la tabla de errores. Eso cubre los
 *    fallos que la aplicación **sí** atrapa y convierte en un mensaje.
 * 2. `onRequestError` cubre los que no atrapa nadie: los que terminan en una
 *    pantalla de error del navegador. Son precisamente los que el cliente no
 *    reporta, porque no sabe qué decir más allá de «no funciona».
 */

export async function register(): Promise<void> {
  // Import dinámico: `instrumentation.ts` también se carga en el entorno Edge,
  // donde la clave de servicio no debe estar. Cargarlo aquí lo mantiene fuera
  // de ese paquete.
  const { instalarDestinoDeErrores } = await import('@/lib/errores-registrados/destino')
  instalarDestinoDeErrores()
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, contexto) => {
  const { esControlDeFlujoDeNext } = await import('@/lib/errores')

  // `redirect()` y `notFound()` funcionan lanzando. Registrarlas llenaría la
  // tabla de navegaciones normales disfrazadas de fallos.
  if (esControlDeFlujoDeNext(err)) return

  const { anotarError } = await import('@/lib/errores-registrados/data')

  /*
    `donde` se arma con la ruta del archivo, no con la del navegador.

    `request.path` trae la URL concreta —`/trabajos/1156412c-…`— y aunque la
    huella normaliza los identificadores, `routePath` es directamente el archivo
    que hay que abrir para arreglarlo. Y el tipo delante distingue el fallo al
    renderizar de el de la acción que se envió desde esa misma página.
  */
  await anotarError({
    donde: `${contexto.routeType} ${contexto.routePath}`,
    mensaje: err instanceof Error ? err.message : String(err),
    codigo: 'NO_ATRAPADO',
    // Sin sesión disponible aquí: `onRequestError` corre fuera del contexto de
    // la petición. La ruta y el mensaje son suficientes para localizarlo.
    laboratorioId: null,
  })
}
