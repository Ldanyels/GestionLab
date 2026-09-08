'use client'

import './globals.css'
import { PantallaDeError } from '@/components/ui/PantallaDeError'

/**
 * Último recurso: se activa cuando falla el propio layout raíz, que ningún
 * `error.tsx` de segmento puede capturar.
 *
 * Reemplaza al layout raíz mientras está activo, así que tiene que traer sus
 * propias etiquetas `<html>` y `<body>` y su hoja de estilos. Tampoco admite
 * `export const metadata`: el título se pone con el componente `<title>` de
 * React. Aquí no hay fuentes de next/font a propósito — si el layout raíz se
 * cayó, conviene depender de lo mínimo.
 */
export default function ErrorGlobal({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="es">
      <body className="min-h-dvh">
        <title>Error — GestionLab</title>
        <PantallaDeError
          titulo="El sistema no pudo cargar"
          explicacion="Ocurrió un error antes de mostrar la aplicación. Vuelve a intentarlo; si sigue pasando, avisa al administrador."
          digest={error.digest}
          detalle={process.env.NODE_ENV === 'development' ? error.message : undefined}
          onReintentar={unstable_retry}
        />
      </body>
    </html>
  )
}
