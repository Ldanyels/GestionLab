import { redirect } from 'next/navigation'
import { getSessionContext } from '@/lib/auth'
import { estaSuspendido } from '@/lib/laboratorio/estado'
import { esSesionSuperAdmin } from '@/lib/plataforma/acceso'
import { AppShell } from '@/components/nav/AppShell'
import { PantallaSuspendida } from '@/components/laboratorio/PantallaSuspendida'
import { PantallaSinLaboratorio } from '@/components/laboratorio/PantallaSinLaboratorio'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, perfil, laboratorio, error } = await getSessionContext()

  // Sin sesión → al login.
  if (!userId) redirect('/login')

  // Se calcula antes de la pantalla sin perfil porque también hace falta ahí:
  // la cuenta que administra la plataforma no pertenece a ningún laboratorio.
  const superAdmin = await esSesionSuperAdmin()

  // Sesión válida pero sin perfil utilizable. No redirigimos (evita el bucle
  // /hoy ↔ /login): mostramos qué pasó, distinguiendo el fallo de lectura
  // (ej. migración pendiente) de un usuario realmente sin laboratorio.
  if (!perfil) {
    return <PantallaSinLaboratorio error={error ?? null} esSuperAdmin={superAdmin} />
  }

  // Cuenta suspendida: se muestra el aviso en lugar de la aplicación. No se
  // redirige a una ruta de aviso porque esa ruta comprobaría lo mismo y el
  // rebote sería un bucle.
  if (estaSuspendido(laboratorio)) {
    return <PantallaSuspendida rol={perfil.rol} />
  }

  return (
    <AppShell perfil={perfil} esSuperAdmin={superAdmin}>
      {children}
    </AppShell>
  )
}
