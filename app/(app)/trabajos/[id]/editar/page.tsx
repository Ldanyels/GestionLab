import { notFound } from 'next/navigation'
import { BackRow } from '@/components/ui/BackRow'
import { getTrabajo } from '@/lib/trabajos/data'
import { getSessionPerfil } from '@/lib/auth'
import { listDoctoresConConsultorio } from '@/lib/consultorios/data'
import { listCatalogo } from '@/lib/catalogo/data'
import { TrabajoForm } from '@/components/trabajos/TrabajoForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { corregirFechaEntregaAction, editarTrabajoAction, eliminarTrabajoAction } from '../../actions'

export default async function EditarTrabajoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [t, perfil, doctores, tipos] = await Promise.all([
    getTrabajo(id),
    getSessionPerfil(),
    listDoctoresConConsultorio(),
    listCatalogo(),
  ])
  if (!t) notFound()

  const esAdmin = perfil?.rol === 'admin'

  return (
    <section className="space-y-4">
      <BackRow href={`/trabajos/${id}`} titulo="Editar trabajo" />
      <TrabajoForm
        action={editarTrabajoAction}
        doctores={doctores}
        tipos={tipos}
        trabajo={t}
        submitLabel="Guardar cambios"
        // Al editar, el plazo se cuenta desde el ingreso real del trabajo: «3
        // días» de un trabajo que entró el lunes sigue siendo el jueves.
        fechaIngreso={t.fecha_ingreso}
      />

      {/*
        Lo que antes vivía en la ficha.

        El laboratorio quiso la ficha limpia —es la pantalla que se abre veinte
        veces al día— y esto se hace una vez cada muchos trabajos. Su sitio es
        aquí: a «Editar» se entra a propósito, y corregir o borrar es
        exactamente lo que se viene a hacer.
      */}
      {esAdmin ? (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3.5">
          {/*
            Corregir la fecha real de salida. Existe porque en el laboratorio se
            marcan varios trabajos de golpe, días después de que salieran: el
            sello automático guarda el día en que alguien se acordó de marcarlo.

            La acción vuelve a comprobar el rol por su cuenta, porque una Server
            Action se puede invocar sin pasar por esta página.
          */}
          {t.estado === 'entregado' ? (
            <form
              action={corregirFechaEntregaAction}
              className="flex flex-wrap items-end gap-2 border-b border-[var(--color-border)] pb-3"
            >
              <input type="hidden" name="id" value={t.id} />
              <label className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Corregir fecha de entrega
                </span>
                <input
                  type="date"
                  name="entregado_el"
                  defaultValue={t.entregado_el ?? ''}
                  required
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </label>
              <button
                type="submit"
                className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-semibold"
              >
                Guardar
              </button>
            </form>
          ) : null}

          {/*
            Borrar se lleva las etapas y los abonos del trabajo: solo el
            administrador. La acción lo comprueba en el servidor; aquí se
            esconde para no ofrecer un botón que expulsa a quien lo pulse.
          */}
          <ConfirmDialog
            action={eliminarTrabajoAction}
            fields={{ id: t.id }}
            triggerLabel="Eliminar trabajo"
            triggerClassName="text-[13.5px] font-semibold text-[var(--color-danger)]"
            title="Eliminar trabajo"
            message="Se borra el trabajo, sus etapas y sus abonos. No se puede deshacer."
            confirmLabel="Sí, eliminar"
          />
        </div>
      ) : null}
    </section>
  )
}
