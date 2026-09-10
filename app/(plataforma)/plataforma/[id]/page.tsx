import Link from 'next/link'
import { notFound } from 'next/navigation'
import { correoSesion } from '@/lib/plataforma/acceso'
import { registrarAccesoDePlataforma } from '@/lib/plataforma/auditoria'
import {
  resumenDeLaboratorio,
  trabajosDeLaboratorio,
} from '@/lib/plataforma/laboratorio-detalle'
import { usuariosParaElPanel } from '@/lib/plataforma/usuarios'
import { FichaLaboratorio } from '@/components/plataforma/FichaLaboratorio'
import { UsuariosDeLaboratorio } from '@/components/plataforma/UsuariosDeLaboratorio'
import { restablecerClaveDeLaboratorioAction } from './actions'

/**
 * Ficha de un laboratorio ajeno.
 *
 * La guardia de super-administrador no se repite aquí: `(plataforma)/layout.tsx`
 * ya llama a `requireSuperAdmin()` y cubre todas las páginas del grupo. La
 * repetición sí es necesaria en las Server Actions, que se pueden invocar sin
 * pasar por ninguna página, y este archivo no define ninguna.
 */
export default async function LaboratorioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const resumen = await resumenDeLaboratorio(id)
  if (!resumen) notFound()

  const [trabajos, usuarios] = await Promise.all([
    trabajosDeLaboratorio(id),
    usuariosParaElPanel(id),
  ])

  // El acceso se registra después de comprobar que el laboratorio existe: una
  // dirección tecleada al azar no debe ensuciar el historial de nadie. Y no se
  // condiciona nada a su resultado: la función no lanza.
  const correo = await correoSesion()
  if (correo) await registrarAccesoDePlataforma(id, correo)

  return (
    <div className="space-y-6">
      <Link href="/plataforma" className="inline-block text-[13.5px] text-[var(--color-muted)]">
        ‹ Laboratorios
      </Link>
      <FichaLaboratorio resumen={resumen} trabajos={trabajos} />

      <Link
        href={`/plataforma/${id}/catalogo`}
        className="inline-block text-[13.5px] font-semibold text-[var(--color-accent)]"
      >
        Ver y corregir su catálogo →
      </Link>

      <UsuariosDeLaboratorio
        labId={id}
        usuarios={usuarios}
        accion={restablecerClaveDeLaboratorioAction}
      />
    </div>
  )
}
