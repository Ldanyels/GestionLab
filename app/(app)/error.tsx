'use client'

import { PantallaDeError } from '@/components/ui/PantallaDeError'

/**
 * Límite de error de la aplicación.
 *
 * Antes no existía: cuando una Server Action o una página fallaba, Next mostraba
 * su pantalla cruda ("Application error: a server-side exception has occurred").
 * Este archivo se renderiza dentro de `app/(app)/layout.tsx`, así que la barra
 * lateral y la navegación inferior siguen visibles y el usuario puede irse a
 * otra sección sin recargar.
 *
 * En Next 16 la prop para reintentar es `unstable_retry`, no `reset`:
 * `unstable_retry` vuelve a pedir y renderizar el segmento, mientras que `reset`
 * solo limpia el estado del límite sin volver a consultar los datos.
 */
export default function ErrorDeAplicacion({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <PantallaDeError
      digest={error.digest}
      // En producción Next no envía el mensaje original al navegador. Aquí se
      // muestra solo en desarrollo, para no filtrar detalles internos.
      detalle={process.env.NODE_ENV === 'development' ? error.message : undefined}
      onReintentar={unstable_retry}
    />
  )
}
