import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconoHoy(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M3 9h18M8 2.5v3M16 2.5v3" />
      <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconoConsultorios(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
      <path d="M14 21V9h5a1 1 0 0 1 1 1v11" />
      <path d="M3 21h18M7.5 8h3M7.5 12h3M7.5 16h3" />
    </svg>
  )
}

export function IconoTrabajos(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
      <path d="M3 12.5 12 17l9-4.5M3 17 12 21.5 21 17" />
    </svg>
  )
}

export function IconoInventario(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  )
}

export function IconoFinanzas(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 21h18" />
      <path d="M6 21v-6M12 21V7M18 21v-9" />
    </svg>
  )
}

/** Marca dental (diente) — identidad del laboratorio. */
export function LogoDiente(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M7 3C4.8 3 3.2 4.9 3.6 7.4c.2 1.7.9 3.2 1.4 5.6.4 1.9.5 6 1.9 6 1.2 0 1.1-3.4 2.1-4.7.4-.5 1.6-.5 2 0 1 1.3.9 4.7 2.1 4.7 1.4 0 1.5-4.1 1.9-6 .5-2.4 1.2-3.9 1.4-5.6C20.8 4.9 19.2 3 17 3c-1.9 0-2.8 1-5 1S8.9 3 7 3Z" />
    </svg>
  )
}

export const ICONOS = {
  '/hoy': IconoHoy,
  '/consultorios': IconoConsultorios,
  '/trabajos': IconoTrabajos,
  '/inventario': IconoInventario,
  '/finanzas': IconoFinanzas,
} as const
