/**
 * Clases compartidas de formulario (spec 9: input 48 px, radio 12,
 * fondo `surface-2`, etiqueta 13 px/600). Un solo lugar para cambiarlas.
 */
export const CAMPO =
  'h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-[15px] outline-none focus:border-[var(--color-accent)]'

/** Campo compacto para filas de edición en línea. */
export const CAMPO_COMPACTO =
  'h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'

export const ETIQUETA = 'text-[13px] font-semibold text-[var(--color-muted)]'

export const BOTON_PRIMARIO =
  'h-[50px] w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-base font-semibold text-[var(--color-accent-contrast)] transition-transform active:scale-[0.99] disabled:opacity-50'

export const BOTON_SECUNDARIO =
  'h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-semibold transition-colors hover:border-[var(--color-accent)]'
