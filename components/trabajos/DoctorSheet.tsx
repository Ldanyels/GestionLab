'use client'

import { useMemo, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { filtrarDoctores } from '@/lib/consultorios/filtro'
import type { DoctorOpcion } from '@/lib/consultorios/data'

interface Props {
  doctores: DoctorOpcion[]
  abierta: boolean
  onCerrar: () => void
  onElegir: (id: string) => void
}

/**
 * Hoja para elegir doctor, con buscador.
 *
 * Sustituye a un `<select>` nativo. Con treinta y nueve doctores, el
 * desplegable del teléfono obliga a desplazar una lista larga sin poder
 * escribir, y en el escritorio solo permite saltar por la primera letra de lo
 * que el navegador considere el texto de la opción —que aquí empieza por el
 * consultorio, no por el doctor.
 *
 * Agrupa por consultorio como la lista de tipos agrupa por categoría: un
 * laboratorio piensa «el de Arte oral» antes que el apellido.
 */
export function DoctorSheet({ doctores, abierta, onCerrar, onElegir }: Props) {
  const [q, setQ] = useState('')

  const filtrados = useMemo(() => filtrarDoctores(doctores, q), [doctores, q])
  const consultorios = useMemo(
    () => [...new Set(filtrados.map((d) => d.consultorio_nombre))],
    [filtrados],
  )

  const elegir = (id: string) => {
    onElegir(id)
    // La búsqueda se limpia al elegir: si quedara escrita, la próxima vez que
    // se abra la hoja mostraría una lista filtrada por algo que ya no viene a
    // cuento y parecería que faltan doctores.
    setQ('')
    onCerrar()
  }

  return (
    <Sheet abierta={abierta} onCerrar={onCerrar} titulo="Doctor">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar doctor"
        placeholder="Buscar por doctor o consultorio…"
        className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-surface-2)] px-3 outline-none"
      />

      {filtrados.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-muted)]">
          Sin resultados para «{q}».
        </p>
      ) : (
        <div className="mt-2">
          {consultorios.map((cons) => (
            <div key={cons}>
              <p className="px-1 pb-1 pt-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {cons}
              </p>
              {filtrados
                .filter((d) => d.consultorio_nombre === cons)
                .map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => elegir(d.id)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-accent-soft)]"
                  >
                    <span className="min-w-0 text-[14.5px]">{d.nombre}</span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </Sheet>
  )
}
