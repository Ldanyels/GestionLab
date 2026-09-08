import type { Rol } from '@/lib/supabase/types'

interface Props {
  rol: Rol
  /**
   * Contacto para regularizar. Se pasa desde arriba en vez de fijarlo aquí:
   * mientras no exista la capa de suscripciones no hay un dato real que poner,
   * y una dirección inventada es peor que ninguna.
   */
  contacto?: string
}

/**
 * Pantalla que ve un laboratorio con la cuenta suspendida.
 *
 * Se renderiza en lugar de la aplicación, no como redirección: redirigir desde
 * las páginas hacia una ruta de aviso arriesga un bucle si esa ruta también
 * comprueba el estado. El layout decide y muestra esto en su lugar.
 */
export function PantallaSuspendida({ rol, contacto }: Props) {
  const esAdmin = rol === 'admin'

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <section className="w-full max-w-[440px] text-center">
        <span
          aria-hidden
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-warn-soft)]"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-warn)"
            strokeWidth="1.9"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M10 9v6M14 9v6" />
          </svg>
        </span>

        <h1 className="titulo-balance mt-4 text-[22px] font-bold leading-tight">
          Cuenta suspendida
        </h1>

        <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
          {esAdmin
            ? 'El acceso a GestionLab está en pausa porque hay un pago pendiente. Tus datos siguen guardados: al regularizar, todo vuelve como estaba.'
            : 'El laboratorio tiene un pago pendiente y el acceso está en pausa. Avisa a tu administrador para reactivarlo.'}
        </p>

        {esAdmin && contacto ? (
          <p className="mt-4 text-[14px]">
            Para reactivarla, escribe a{' '}
            <span className="font-semibold text-[var(--color-accent)]">{contacto}</span>
          </p>
        ) : null}

        <a
          href="/login/logout"
          className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[15px] font-semibold"
        >
          Salir
        </a>
      </section>
    </main>
  )
}
