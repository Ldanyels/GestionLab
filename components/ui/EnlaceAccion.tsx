import Link from 'next/link'

/**
 * Un enlace que se ve y se toca como un botón.
 *
 * Nació de un fallo real: las acciones de Finanzas —«Registrar un gasto»,
 * «Registrar un pago»— estaban puestas como texto de 13 px al pie de cada
 * tarjeta. En un teléfono, con la tarjeta estrecha, quedaban justo debajo del
 * contenido y se encontraban; en una pantalla ancha, la misma línea de texto
 * pequeño se perdía y el usuario informó que «no están los botones».
 *
 * Estaban. No parecían botones, que para el caso es lo mismo.
 *
 * Ocupa todo el ancho en móvil —donde se toca con el pulgar— y solo lo que
 * necesita en pantallas grandes, donde una barra de 880 px de ancho para dos
 * palabras se ve como un error de maquetación.
 */
export function EnlaceAccion({
  href,
  children,
  className = '',
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:border-[var(--color-accent)] active:scale-[0.99] sm:w-auto ${className}`}
    >
      {children}
    </Link>
  )
}
