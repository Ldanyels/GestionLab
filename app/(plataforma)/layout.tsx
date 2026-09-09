import type { ReactNode } from 'react'
import { requireSuperAdmin } from '@/lib/plataforma/acceso'

/**
 * Grupo de rutas del panel de plataforma.
 *
 * Sin la barra lateral de la aplicación a propósito: esto no pertenece a ningún
 * laboratorio, y montar el `AppShell` aquí obligaría a tener un perfil de
 * inquilino para administrar la plataforma.
 *
 * La guardia va en el servidor y cubre todas las páginas del grupo. Las Server
 * Actions repiten la comprobación por su cuenta, porque se pueden invocar sin
 * pasar por ninguna página.
 */
export default async function PlataformaLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin()
  return <div className="mx-auto w-full max-w-[720px] px-4 py-6">{children}</div>
}
