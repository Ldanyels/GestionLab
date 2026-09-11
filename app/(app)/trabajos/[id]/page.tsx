import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTrabajo } from '@/lib/trabajos/data'
import { getSessionPerfil } from '@/lib/auth'
import { puedeBorrarAbonos, puedeRegistrarAbonos, veMontos } from '@/lib/permisos'
import { costoInsumosPorTrabajo } from '@/lib/inventario/data'
import { progresoTrabajo } from '@/lib/trabajos/estado'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { FechaEntregaEditable } from '@/components/trabajos/FechaEntregaEditable'
import { FotosDelTrabajo } from '@/components/fotos/FotosDelTrabajo'
import { fotosConEnlace } from '@/lib/fotos/data'
import { EstadoBadge } from '@/components/trabajos/EstadoBadge'
import { EtapaAcciones } from '@/components/trabajos/EtapaAcciones'
import { PagosSection } from '@/components/trabajos/PagosSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  cambiarEstadoTrabajoAction,
  corregirFechaEntregaAction,
  eliminarTrabajoAction,
} from '../actions'

const enlace = 'text-[13.5px] font-semibold text-[var(--color-accent)]'

export default async function TrabajoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [t, perfil] = await Promise.all([getTrabajo(id), getSessionPerfil()])
  if (!t) notFound()
  // Después del `notFound`: no tiene sentido firmar enlaces de un trabajo que
  // no existe.
  const fotos = await fotosConEnlace(id)

  const progreso = progresoTrabajo(t.etapas)
  const montos = veMontos(perfil)
  const registraAbonos = puedeRegistrarAbonos(perfil)
  const borraAbonos = puedeBorrarAbonos(perfil)
  const costoInsumos = montos ? await costoInsumosPorTrabajo(t.id) : 0
  const margen = Math.round((t.precio_acordado - costoInsumos) * 100) / 100
  const saldo = t.saldo

  return (
    <section className="space-y-4">
      <Link href="/trabajos" className="inline-block text-[13.5px] text-[var(--color-muted)]">
        ‹ Trabajos
      </Link>

      {/* Cabecera: el título tiene la fila para sí; las acciones van debajo. */}
      <Card
        tono="destacada"
        colorLateral={colorConsultorio(t.consultorio_nombre)}
        className="space-y-3.5 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <h1 className="titulo-balance min-w-0 text-2xl font-bold leading-tight">
            {t.tipo_nombre}
          </h1>
          <EstadoBadge estado={t.estado} />
        </div>

        <p className="text-[13px] text-[var(--color-muted)]">
          {t.consultorio_nombre} ·{' '}
          <Link href={`/doctores/${t.doctor_id}`} className="text-[var(--color-accent)]">
            {t.doctor_nombre}
          </Link>
          {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
        </p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
          {montos ? (
            <>
              <Dato etiqueta="Precio acordado" valor={formatMoney(t.precio_acordado)} />
              <Dato
                etiqueta="Saldo"
                valor={formatMoney(saldo)}
                tono={saldo > 0.001 ? 'peligro' : 'exito'}
              />
            </>
          ) : null}
          <Dato etiqueta="Ingreso" valor={t.fecha_ingreso} />
          {/*
            En un entregado se muestra la fecha real y no la prometida: la
            promesa ya no informa de nada cuando el trabajo salió, y tenerlas
            las dos a la vez invita a leer una por la otra.
          */}
          {t.estado === 'entregado' ? (
            <Dato etiqueta="Entregado" valor={t.entregado_el ?? 'Sin registrar'} />
          ) : (
            <Dato etiqueta="Entrega" valor={t.fecha_entrega ?? 'Sin fecha'} />
          )}
        </div>

        {/*
          El control de la fecha prometida vive aquí, en la ficha, y no solo en
          el formulario de edición: entrar al formulario completo para poner una
          fecha es fricción suficiente como para que no se haga.

          Solo mientras el trabajo no se haya entregado. Después, la fecha que
          informa es la real, y esa se corrige por otro camino y solo un
          administrador.
        */}
        {t.estado === 'entregado' ? null : (
          <FechaEntregaEditable
            trabajoId={t.id}
            fechaIngreso={t.fecha_ingreso}
            fechaEntrega={t.fecha_entrega}
          />
        )}

        <div className="flex flex-wrap gap-2">
          {t.estado !== 'cerrado' ? (
            <EstadoBtn id={t.id} estado="cerrado" label="Cerrar trabajo" />
          ) : null}
          {t.estado !== 'entregado' ? (
            <EstadoBtn id={t.id} estado="entregado" label="Marcar entregado" ghost />
          ) : null}
          {t.estado !== 'en_curso' ? (
            <EstadoBtn id={t.id} estado="en_curso" label="Reabrir" ghost />
          ) : null}
        </div>

        {t.estado === 'entregado' && perfil?.rol === 'admin' ? (
          <CorregirEntrega id={t.id} fecha={t.entregado_el} />
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-3">
          <Link href={`/trabajos/${t.id}/recibo`} className={enlace}>
            Recibo
          </Link>
          <Link href={`/trabajos/${t.id}/editar`} className={enlace}>
            Editar
          </Link>
          <Link href={`/trabajos/nuevo?doctor=${t.doctor_id}`} className={enlace}>
            + Otro trabajo para {t.doctor_nombre}
          </Link>
          <span className="ml-auto">
            <ConfirmDialog
              action={eliminarTrabajoAction}
              fields={{ id: t.id }}
              triggerLabel="Eliminar"
              triggerClassName="text-[13.5px] font-semibold text-[var(--color-danger)]"
              title="Eliminar trabajo"
              message="Se borra el trabajo, sus etapas y sus abonos. No se puede deshacer."
              confirmLabel="Sí, eliminar"
            />
          </span>
        </div>
      </Card>

      {t.items.length > 0 ? (
        <Card className="p-3.5">
          <h2 className="text-base font-bold">Trabajos de la cuenta</h2>
          <ul className="mt-2 space-y-1.5">
            {t.items.map((i) => (
              <li key={i.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-[var(--color-muted)]">
                  {i.cantidad > 1 ? `${i.cantidad} × ` : ''}
                  {i.tipo_nombre}
                  {i.pieza ? ` · pza ${i.pieza}` : ''}
                </span>
                {montos ? (
                  <span className="num shrink-0 font-semibold">
                    {formatMoney(i.subtotal)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {t.notas ? (
        <Card className="p-3.5 text-sm">{t.notas}</Card>
      ) : null}

      {montos ? (
        <Card className="p-3.5">
          <h2 className="text-base font-bold">Costeo del trabajo</h2>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
            <span>
              <span className="block text-xs text-[var(--color-muted)]">Precio</span>
              <span className="num font-semibold">{formatMoney(t.precio_acordado)}</span>
            </span>
            <span>
              <span className="block text-xs text-[var(--color-muted)]">Insumos</span>
              <span className="num font-semibold">{formatMoney(costoInsumos)}</span>
            </span>
            <span>
              <span className="block text-xs text-[var(--color-muted)]">Margen</span>
              <span
                className={`num font-semibold ${margen >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}
              >
                {formatMoney(margen)}
              </span>
            </span>
          </div>
          {costoInsumos === 0 ? (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              El costo de insumos se calcula al cerrar el trabajo, según su receta.
            </p>
          ) : null}
        </Card>
      ) : null}

      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[17px] font-bold">Etapas</h2>
          <span className="num shrink-0 text-[13px] text-[var(--color-muted)]">
            {progreso}% completado
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
        {t.etapas.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Este tipo de trabajo no tenía etapas en su plantilla.
          </p>
        ) : (
          <ul className="space-y-2">
            {t.etapas.map((e) => (
              <EtapaAcciones key={e.id} etapa={e} />
            ))}
          </ul>
        )}
      </div>

      {/*
        Las fotos van antes que los pagos: son parte de hacer el trabajo, no de
        cobrarlo, y quien abre esta ficha en el taller viene a eso.

        Cualquiera del laboratorio puede añadirlas y borrarlas, como puede
        cambiar el estado del trabajo: el técnico es quien tiene la pieza en la
        mano cuando llega y cuando sale.
      */}
      <FotosDelTrabajo trabajoId={t.id} fotos={fotos} puedeEditar />

      {/* La sección de pagos se abre al técnico con permiso de abonos: para
          cobrar necesita ver el precio y el saldo de este trabajo. El costeo
          interno (insumos y margen) sigue arriba detrás de `montos`. */}
      {registraAbonos ? (
        <PagosSection
          trabajoId={t.id}
          precio={t.precio_acordado}
          puedeBorrar={borraAbonos}
          // La sección solo se muestra a quien registra abonos, así que quien
          // llega hasta aquí puede corregirlos.
          puedeEditar={registraAbonos}
        />
      ) : (
        <Card className="p-3.5 text-sm text-[var(--color-muted)]">
          Los pagos de este trabajo los gestiona un administrador.
        </Card>
      )}
    </section>
  )
}

function Dato({
  etiqueta,
  valor,
  tono,
}: {
  etiqueta: string
  valor: string
  tono?: 'peligro' | 'exito'
}) {
  const color =
    tono === 'peligro'
      ? 'text-[var(--color-danger)]'
      : tono === 'exito'
        ? 'text-[var(--color-success)]'
        : ''
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3 py-2">
      <p className="text-xs text-[var(--color-muted)]">{etiqueta}</p>
      <p className={`num text-[15px] font-semibold ${color}`}>{valor}</p>
    </div>
  )
}

function EstadoBtn({
  id,
  estado,
  label,
  ghost,
}: {
  id: string
  estado: string
  label: string
  ghost?: boolean
}) {
  return (
    <form action={cambiarEstadoTrabajoAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button
        type="submit"
        className={`h-11 rounded-[var(--radius-md)] px-4 text-sm font-semibold transition-transform active:scale-[0.99] ${
          ghost
            ? 'border border-[var(--color-border)] text-[var(--color-text)]'
            : 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
        }`}
      >
        {label}
      </button>
    </form>
  )
}

/**
 * Corrección de la fecha real de entrega. Solo administradores.
 *
 * Existe porque en el laboratorio se marcan varios trabajos de golpe, días
 * después de que salieran: el sello automático guardaría el día en que alguien
 * se acordó de marcarlo. La acción vuelve a comprobar el rol por su cuenta,
 * porque una Server Action se puede invocar sin pasar por esta página.
 */
function CorregirEntrega({ id, fecha }: { id: string; fecha: string | null }) {
  return (
    <form
      action={corregirFechaEntregaAction}
      className="flex flex-wrap items-end gap-2 border-t border-[var(--color-border)] pt-3"
    >
      <input type="hidden" name="id" value={id} />
      <label className="space-y-1">
        <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          Corregir fecha de entrega
        </span>
        <input
          type="date"
          name="entregado_el"
          defaultValue={fecha ?? ''}
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
  )
}
