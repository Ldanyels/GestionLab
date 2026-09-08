'use client'

import { PantallaDeError } from '@/components/ui/PantallaDeError'

/**
 * Límite de error del inicio de sesión. La salida apunta al login y no a Hoy:
 * quien llega aquí todavía no tiene sesión.
 */
export default function ErrorDeAutenticacion({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <PantallaDeError
      titulo="No pudimos cargar el inicio de sesión"
      explicacion="Puede ser un problema momentáneo de conexión. Vuelve a intentarlo."
      digest={error.digest}
      detalle={process.env.NODE_ENV === 'development' ? error.message : undefined}
      onReintentar={unstable_retry}
      hrefSalida="/login"
      etiquetaSalida="Ir al inicio de sesión"
    />
  )
}
