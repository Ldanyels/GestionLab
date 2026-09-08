'use client'

import type { LineaRecibo } from '@/lib/recibos/lineas'

const btnClass =
  'inline-flex h-11 items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold'

interface Props {
  lineas: LineaRecibo[]
  pdfHref: string
  pdfLabel?: string
}

/** Vista previa del recibo (ticket 80mm) con acciones de imprimir y exportar PDF. */
export function ReciboTicket({ lineas, pdfHref, pdfLabel = 'Exportar PDF' }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className={`${btnClass} bg-[var(--color-accent)] text-[var(--color-accent-contrast)]`}
        >
          Imprimir 80 mm
        </button>
        <a
          href={pdfHref}
          className={`${btnClass} border border-[var(--color-border)]`}
        >
          {pdfLabel}
        </a>
      </div>

      <div
        id="recibo-print"
        className="mx-auto w-[360px] max-w-full border border-dashed border-[var(--color-border)] bg-white p-4 font-mono text-[13px] leading-[1.7] text-black"
      >
        {lineas.map((l, i) =>
          l.separador ? (
            <div key={i} className="my-1 border-t border-dashed border-neutral-400" />
          ) : (
            <div
              key={i}
              className={`flex gap-2 ${
                l.centrada ? 'justify-center text-center' : 'justify-between'
              } ${l.bold ? 'font-bold' : ''}`}
            >
              <span className={l.centrada ? '' : 'min-w-0 break-words'}>{l.izq}</span>
              {l.der ? <span className="shrink-0 text-right">{l.der}</span> : null}
            </div>
          ),
        )}
      </div>

      {/* Al imprimir: solo el ticket, en papel de 80mm y sin márgenes. */}
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body * { visibility: hidden; }
          #recibo-print, #recibo-print * { visibility: visible; }
          #recibo-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            border: none;
          }
        }
      `}</style>
    </div>
  )
}
