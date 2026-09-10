'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CAMPO_COMPACTO } from '@/components/ui/campos'
import { formatMoney } from '@/lib/format'
import { METODOS_PAGO } from '@/lib/abonos/types'
import { totalDelCobro, validarCobro } from '@/lib/abonos/cobro'
import type { TrabajoCobrable } from '@/lib/abonos/data'
import { useConexion } from '@/components/conexion/useConexion'
import type { FormState } from '@/app/(app)/trabajos/actions'

const initial: FormState = { error: '' }

/**
 * Registrar un pago de un consultorio repartido entre sus trabajos.
 *
 * Al frente de cada fila va el paciente cuando lo hay, y el trabajo cuando no.
 * Los dos casos ocurren: el consultorio suele ser intermediario y pasa lo que
 * le pagó un paciente —«pagaron Jeremías y Luis angel»— pero también encarga
 * trabajos por su cuenta, y entonces la deuda es suya sin paciente de por
 * medio. Por eso se marca a mano y no se reparte por antigüedad: quién pagó es
 * información que está fuera del sistema.
 *
 * Nada se marca de entrada. El pago casi nunca cubre toda la deuda, y una
 * pantalla que llegara con los doce trabajos marcados registraría S/1.960 al
 * primer descuido.
 */
export function FormularioDeCobro({
  consultorioId,
  consultorio,
  trabajos,
  hoy,
  action,
}: {
  consultorioId: string
  consultorio: string
  trabajos: TrabajoCobrable[]
  hoy: string
  action: (prev: FormState, formData: FormData) => Promise<FormState>
}) {
  const [state, formAction, pending] = useActionState(action, initial)
  const enLinea = useConexion()

  /** Los trabajos marcados, con el importe que se les aplica. */
  const [marcados, setMarcados] = useState<Record<string, string>>({})
  const [fecha, setFecha] = useState(hoy)

  const lineas = trabajos
    .filter((t) => marcados[t.trabajo_id] !== undefined)
    .map((t) => ({
      trabajo_id: t.trabajo_id,
      saldo: t.saldo,
      monto: Number(marcados[t.trabajo_id] ?? 0),
    }))

  const total = totalDelCobro(lineas)
  const validacion = validarCobro(lineas)
  const deudaTotal = trabajos.reduce((s, t) => s + t.saldo, 0)

  function alternar(t: TrabajoCobrable) {
    setMarcados((prev) => {
      const copia = { ...prev }
      if (copia[t.trabajo_id] !== undefined) delete copia[t.trabajo_id]
      // Al marcar, se propone cobrarlo entero: es lo normal cuando un paciente
      // paga su trabajo. Bajarlo es un caso, no la regla.
      else copia[t.trabajo_id] = String(t.saldo)
      return copia
    })
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="consultorio_id" value={consultorioId} />
      <input type="hidden" name="lineas" value={JSON.stringify(lineas)} />

      <p className="text-[13.5px] text-[var(--color-muted)]">
        {consultorio} debe {formatMoney(deudaTotal)} en {trabajos.length}{' '}
        {trabajos.length === 1 ? 'trabajo' : 'trabajos'}. Marca los que cubre este pago.
      </p>

      <ul className="space-y-2">
        {trabajos.map((t) => {
          const marcado = marcados[t.trabajo_id] !== undefined
          return (
            <li
              key={t.trabajo_id}
              className={`rounded-[var(--radius-md)] border p-3 ${
                marcado
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternar(t)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                />
                <span className="min-w-0 flex-1">
                  {/*
                    Manda el paciente cuando lo hay; si no, el trabajo.

                    Los dos casos son legítimos: a veces el consultorio cobra a
                    un paciente y pasa ese dinero, y a veces encarga el trabajo
                    por su cuenta y la deuda es suya. Una etiqueta «Sin
                    paciente» trataría el segundo caso como un dato que falta y
                    haría que el laboratorio buscara algo que no existe.
                  */}
                  <span className="block truncate text-[14.5px] font-semibold">
                    {t.paciente ?? t.resumen}
                  </span>
                  <span className="block truncate text-[12.5px] text-[var(--color-muted)]">
                    {t.paciente ? `${t.resumen} · ${t.fecha_ingreso}` : t.fecha_ingreso}
                  </span>
                </span>
                <span className="num shrink-0 text-[13.5px] font-semibold">
                  {formatMoney(t.saldo)}
                </span>
              </label>

              {/*
                El importe solo aparece cuando la fila está marcada. Doce campos
                de importe visibles a la vez, once de ellos irrelevantes, hacen
                que no se lea ninguno.
              */}
              {marcado ? (
                <label className="mt-2.5 flex items-center gap-2 border-t border-[var(--color-border)] pt-2.5">
                  <span className="text-[12.5px] text-[var(--color-muted)]">Cobrar</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={t.saldo}
                    value={marcados[t.trabajo_id]}
                    onChange={(e) =>
                      setMarcados((prev) => ({ ...prev, [t.trabajo_id]: e.target.value }))
                    }
                    aria-label={`Importe para ${t.paciente ?? t.resumen}`}
                    className={`${CAMPO_COMPACTO} w-[120px]`}
                  />
                  {Number(marcados[t.trabajo_id]) < t.saldo ? (
                    <span className="text-[12.5px] text-[var(--color-muted)]">
                      queda {formatMoney(t.saldo - Number(marcados[t.trabajo_id] ?? 0))}
                    </span>
                  ) : null}
                </label>
              ) : null}
            </li>
          )
        })}
      </ul>

      <div className="space-y-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[12.5px] text-[var(--color-muted)]">Método</span>
            <select name="metodo" defaultValue="yape/plin" className={CAMPO_COMPACTO}>
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[12.5px] text-[var(--color-muted)]">Fecha</span>
            <input
              name="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={CAMPO_COMPACTO}
            />
          </label>
        </div>
        <input
          name="nota"
          placeholder="Nota (opcional)"
          maxLength={200}
          className={CAMPO_COMPACTO}
        />

        <div className="flex items-baseline justify-between gap-2 border-t border-[var(--color-border)] pt-2.5">
          <span className="text-[13px] font-semibold text-[var(--color-muted)]">
            Total del pago
          </span>
          <span className="num text-[19px] font-bold">{formatMoney(total)}</span>
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {state.error}
          </p>
        ) : null}
        {/*
          El motivo por el que no se puede enviar se muestra siempre, no solo al
          intentarlo: un botón apagado sin explicación deja al usuario tocándolo
          otra vez.
        */}
        {!validacion.ok && Object.keys(marcados).length > 0 ? (
          <p className="text-[13px] text-[var(--color-danger)]">{validacion.error}</p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={pending || !enLinea || !validacion.ok}
        >
          {!enLinea
            ? 'Sin conexión'
            : pending
              ? 'Registrando…'
              : total > 0
                ? `Registrar pago de ${formatMoney(total)}`
                : 'Marca los trabajos que cubre el pago'}
        </Button>
      </div>
    </form>
  )
}
