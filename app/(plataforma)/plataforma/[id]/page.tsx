import Link from 'next/link'
import { notFound } from 'next/navigation'
import { correoSesion } from '@/lib/plataforma/acceso'
import { registrarAccesoDePlataforma } from '@/lib/plataforma/auditoria'
import {
  resumenDeLaboratorio,
  trabajosDeLaboratorio,
} from '@/lib/plataforma/laboratorio-detalle'
import { usuariosParaElPanel } from '@/lib/plataforma/usuarios'
import { aceptacionesDeLaboratorio } from '@/lib/legal/data'
import { DOCUMENTOS_LEGALES } from '@/lib/legal/textos.generated'
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

  const [trabajos, usuarios, aceptaciones] = await Promise.all([
    trabajosDeLaboratorio(id),
    usuariosParaElPanel(id),
    aceptacionesDeLaboratorio(id),
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

      {/*
        Qué condiciones aceptó y quién. Es lo que se consulta cuando un cliente
        discute haber aceptado, sin tener que entrar a la base de datos.
      */}
      <section className="space-y-2">
        <h2 className="text-[17px] font-bold tracking-[-0.01em]">Condiciones aceptadas</h2>
        {aceptaciones.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-center text-[13.5px] text-[var(--color-muted)]">
            Este laboratorio todavía no ha aceptado las condiciones. Se le pedirá la próxima
            vez que su administrador entre.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {aceptaciones.map((a) => {
              const doc = DOCUMENTOS_LEGALES.find((d) => d.clave === a.documento)
              const vigente = doc?.version === a.version
              return (
                <li
                  key={`${a.documento}-${a.version}`}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-[13px]"
                >
                  <span className="font-semibold">{doc?.titulo ?? a.documento}</span>
                  <span className="text-[var(--color-muted)]">
                    {' · '}
                    {a.nombre_completo}, DNI {a.dni}
                    {' · '}
                    {a.creado_en.slice(0, 10)}
                  </span>
                  {/*
                    Si aceptó una versión que ya no es la vigente, se dice: el
                    laboratorio va a volver a ver la pantalla de aceptación y
                    conviene saber por qué.
                  */}
                  <span
                    className={`num ml-1 text-[11.5px] ${
                      vigente ? 'text-[var(--color-muted)]' : 'text-[var(--color-danger)]'
                    }`}
                  >
                    {a.version}
                    {vigente ? '' : ' (desactualizada)'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

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
