import { redirect } from 'next/navigation'
import { getSessionContext } from '@/lib/auth'
import { estaSuspendido } from '@/lib/laboratorio/estado'
import { esSesionSuperAdmin } from '@/lib/plataforma/acceso'
import { AppShell } from '@/components/nav/AppShell'
import { PantallaSuspendida } from '@/components/laboratorio/PantallaSuspendida'
import { PantallaSinLaboratorio } from '@/components/laboratorio/PantallaSinLaboratorio'
import { PantallaAceptacion } from '@/components/legal/PantallaAceptacion'
import { pendientesDeLaboratorio } from '@/lib/legal/data'
import { nombreLaboratorioActual } from '@/lib/tenant'
import { aceptarDocumentosAction } from './legal/actions'

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

  /*
    Condiciones sin aceptar: se pide antes de dejar entrar.
    
    Solo al administrador, que es quien representa al laboratorio y puede
    comprometerlo. A un técnico no se le bloquea el trabajo por un contrato que
    no le corresponde firmar; el panel de plataforma muestra qué laboratorios
    siguen sin aceptar, que es donde eso se vigila.
  */
  if (perfil.rol === 'admin') {
    const pendientes = await pendientesDeLaboratorio(perfil.laboratorio_id)
    if (pendientes.length > 0) {
      return (
        <PantallaAceptacion
          documentos={pendientes}
          laboratorio={await nombreLaboratorioActual()}
          action={aceptarDocumentosAction}
        />
      )
    }
  }

  return (
    <AppShell perfil={perfil} esSuperAdmin={superAdmin}>
      {children}
    </AppShell>
  )
}
