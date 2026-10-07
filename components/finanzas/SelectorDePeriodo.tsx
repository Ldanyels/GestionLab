import Link from 'next/link'
import {
  ETIQUETA_PERIODO_FINANZAS,
  type PeriodoResuelto,
} from '@/lib/finanzas/periodo'

const campo =
  'h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[13px] outline-none focus:border-[var(--color-accent)]'

/**
 * Qué periodo se está mirando, y cómo cambiarlo.
 *
 * Sin JavaScript: los atajos son enlaces y el rango es un `<form method="get">`.
 * Una pantalla de dinero tiene que poder marcarse en favoritos y compartirse
 * —«mírame setiembre»— y eso solo funciona si el periodo vive en la URL.
 *
 * Los dos campos de fecha se muestran siempre, llenos con el rango vigente.
 * Escondidos tras un «Rango…» quedaban invisibles, que es el problema que ya
 * dio el registro de gastos: la opción estaba y nadie la encontraba.
 */
export function SelectorDePeriodo({
  ruta,
  p,
}: {
  /** La pantalla a la que vuelven los enlaces: `/finanzas` o `/finanzas/gastos`. */
  ruta: string
  p: PeriodoResuelto
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-center gap-1">
        {(['mes', 'mes_anterior'] as const).map((clave) => {
          const activo = p.periodo === clave
          return (
            <Link
              key={clave}
              href={`${ruta}?periodo=${clave}`}
              aria-current={activo ? 'page' : undefined}
              className={`rounded-[var(--radius-sm)] px-2 py-1 text-[13px] transition-colors ${
                activo
                  ? 'font-semibold text-[var(--color-accent)] underline decoration-2 underline-offset-[5px]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {ETIQUETA_PERIODO_FINANZAS[clave]}
            </Link>
          )
        })}
      </div>

      <form method="get" action={ruta} className="flex flex-wrap items-center gap-1.5">
        <input type="hidden" name="periodo" value="rango" />
        <label className="flex items-center gap-1 text-[12px] text-[var(--color-muted)]">
          Desde
          <input type="date" name="desde" defaultValue={p.desde} className={campo} />
        </label>
        <label className="flex items-center gap-1 text-[12px] text-[var(--color-muted)]">
          Hasta
          <input type="date" name="hasta" defaultValue={p.hasta} className={campo} />
        </label>
        <button
          type="submit"
          className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-[13px] font-semibold transition active:scale-[0.98]"
        >
          Ver
        </button>
      </form>
    </div>
  )
}
