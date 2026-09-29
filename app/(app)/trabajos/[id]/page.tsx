import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTrabajo } from '@/lib/trabajos/data'
import { getSessionPerfil } from '@/lib/auth'
import { puedeBorrarAbonos, puedeRegistrarAbonos, veMontos } from '@/lib/permisos'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { FotosDelTrabajo } from '@/components/fotos/FotosDelTrabajo'
import { fotosConEnlace } from '@/lib/fotos/data'
import { EstadoBadge } from '@/components/trabajos/EstadoBadge'
import { PagosSection } from '@/components/trabajos/PagosSection'
import { cambiarEstadoTrabajoAction } from '../actions'

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

  const montos = veMontos(perfil)
  const registraAbonos = puedeRegistrarAbonos(perfil)
  const borraAbonos = puedeBorrarAbonos(perfil)

  return (
    <section className="space-y-4">
      <Link href="/trabajos" className="inline-block text-[13.5px] text-[var(--color-muted)]">
        ‹ Trabajos
      </Link>

      {/*
        La cabecera, reducida a lo que se mira de un vistazo: qué es, de quién
        es, cuándo entró y cuándo sale, y las dos acciones del mostrador.

        Los importes salieron de aquí: están completos en Pagos, y repetirlos
        arriba obligaba a decidir cuál de las dos cifras era la buena.
      */}
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

        <div className="grid grid-cols-2 gap-2">
          <Dato etiqueta="Ingreso" valor={t.fecha_ingreso} />
          {/*
            En un entregado se muestra la fecha real y no la prometida: la
            promesa ya no informa de nada cuando el trabajo salió, y tenerlas
            las dos a la vez invita a leer una por la otra.
          */}
          {t.estado === 'entregado' ? (
            <Dato etiqueta="Entrega" valor={t.entregado_el ?? 'Sin registrar'} />
          ) : (
            <Dato etiqueta="Entrega" valor={t.fecha_entrega ?? 'Sin fecha'} />
          )}
        </div>

        {/*
          Dos huecos fijos, y el recibo siempre en el derecho.

          Antes los botones se pintaban en una fila que se rellenaba sola: al
          marcar entregado desaparecía el primero y el recibo saltaba a la
          izquierda, justo debajo del dedo que acababa de pulsar. En una rejilla
          de dos columnas el hueco izquierdo cambia de botón y el derecho no se
          mueve nunca.
        */}
        <div className="grid grid-cols-2 gap-2">
          {t.estado === 'en_curso' ? (
            <EstadoBtn id={t.id} estado="entregado" label="Entregado" />
          ) : (
            <EstadoBtn id={t.id} estado="en_curso" label="Reabrir" ghost />
          )}
          <Link
            href={`/trabajos/${t.id}/recibo`}
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-semibold transition active:scale-[0.98]"
          >
            Recibo
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-3">
          <Link href={`/trabajos/${t.id}/editar`} className={enlace}>
            Editar
          </Link>
          <Link href={`/trabajos/nuevo?doctor=${t.doctor_id}`} className={enlace}>
            + Otro trabajo para {t.doctor_nombre}
          </Link>
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

      {t.notas ? <Card className="p-3.5 text-sm">{t.notas}</Card> : null}

      {/*
        Las fotos van antes que los pagos: son parte de hacer el trabajo, no de
        cobrarlo, y quien abre esta ficha en el taller viene a eso.

        Cualquiera del laboratorio puede añadirlas y borrarlas, como puede
        cambiar el estado del trabajo: el técnico es quien tiene la pieza en la
        mano cuando llega y cuando sale.
      */}
      <FotosDelTrabajo trabajoId={t.id} fotos={fotos} puedeEditar />

      {/* La sección de pagos se abre al técnico con permiso de abonos: para
          cobrar necesita ver el precio y el saldo de este trabajo. */}
      {registraAbonos ? (
        <PagosSection
          trabajoId={t.id}
          precio={t.precio_acordado}
          estadoTrabajo={t.estado}
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

      {/*
        Cerrar, para quien no ve los pagos.

        El botón vive junto al importe, que es donde se decide; un técnico sin
        permiso de abonos no llega a esa sección y se quedaría sin poder cerrar
        un trabajo terminado.
      */}
      {!registraAbonos && t.estado !== 'cerrado' ? (
        <form action={cambiarEstadoTrabajoAction}>
          <input type="hidden" name="id" value={t.id} />
          <input type="hidden" name="estado" value="cerrado" />
          <button
            type="submit"
            className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-semibold transition active:scale-[0.99]"
          >
            Cerrar trabajo
          </button>
        </form>
      ) : null}

    </section>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3 py-2">
      <p className="text-xs text-[var(--color-muted)]">{etiqueta}</p>
      <p className="num text-[15px] font-semibold">{valor}</p>
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
        className={`h-11 w-full rounded-[var(--radius-md)] px-4 text-sm font-semibold transition-transform active:scale-[0.99] ${
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
