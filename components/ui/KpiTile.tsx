import { Card } from './Card'

type Tono = 'normal' | 'peligro' | 'exito' | 'acento' | 'aviso'

const COLOR: Record<Tono, string> = {
  normal: 'text-[var(--color-text)]',
  peligro: 'text-[var(--color-danger)]',
  exito: 'text-[var(--color-success)]',
  acento: 'text-[var(--color-accent)]',
  aviso: 'text-[var(--color-warn)]',
}

interface Props {
  etiqueta: string
  valor: string
  tono?: Tono
  /** Clases extra del contenedor, ej. `col-span-full` para importes largos. */
  className?: string
}

export function KpiTile({ etiqueta, valor, tono = 'normal', className = '' }: Props) {
  return (
    <Card className={`px-4 py-3.5 ${className}`}>
      <p className="text-[12.5px] font-semibold text-[var(--color-muted)]">{etiqueta}</p>
      <p className={`num mt-0.5 text-[26px] font-bold leading-tight ${COLOR[tono]}`}>
        {valor}
      </p>
    </Card>
  )
}
