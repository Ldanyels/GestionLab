import type { ReactNode } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { LogoDiente } from './icons'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ToastProvider } from '@/components/ui/Toast'
import type { Perfil } from '@/lib/supabase/types'
import { AvisoSinConexion } from '@/components/conexion/AvisoSinConexion'

/**
 * Estructura de la app: barra lateral en escritorio (≥980 px),
 * header + barra inferior en móvil. Punto de corte único.
 */
export function AppShell({
  perfil,
  esSuperAdmin = false,
  children,
}: {
  perfil: Perfil
  /**
   * Si la sesión administra la plataforma. Lo calcula el layout, que es
   * asíncrono; este componente se mantiene sincrónico para poder montarse en
   * las pruebas sin resolver una promesa.
   */
  esSuperAdmin?: boolean
  children: ReactNode
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <Sidebar perfil={perfil} esSuperAdmin={esSuperAdmin} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header solo en móvil: en escritorio manda la barra lateral. */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 px-4 backdrop-blur min-[980px]:hidden">
            <span className="flex items-center gap-2 font-bold tracking-tight">
              <LogoDiente className="text-[var(--color-accent)]" width={20} height={20} />
              GestionLab
            </span>
            <nav className="flex items-center gap-1 text-sm">
              {/*
                En móvil no hay barra lateral, así que este es el único acceso
                al panel. Va como palabra y no como icono: es una ruta que se
                visita de vez en cuando y no tiene un símbolo reconocible.
              */}
              {esSuperAdmin ? (
                <Link
                  href="/plataforma"
                  className="flex h-10 items-center rounded-[var(--radius-md)] px-2 text-[13px] font-semibold text-[var(--color-accent)]"
                >
                  Plataforma
                </Link>
              ) : null}
              <ThemeToggle />
              {perfil.rol === 'admin' ? (
                <Link
                  href="/configuracion"
                  aria-label="Configuración"
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition-colors active:text-[var(--color-accent)]"
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
                  </svg>
                </Link>
              ) : null}
              <a
                href="/login/logout"
                aria-label="Salir"
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition-colors active:text-[var(--color-danger)]"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </a>
            </nav>
          </header>

          <main className="mx-auto w-full max-w-[880px] flex-1 px-4 pb-[110px] pt-[18px] min-[980px]:pb-8">
            {children}
          </main>
        </div>

        {/*
          El aviso de conexión va en el armazón y no en cada pantalla: la
          conexión se pierde en cualquier sitio, no solo donde hay un
          formulario.
        */}
        <AvisoSinConexion />
        <BottomNav perfil={perfil} />
      </div>
    </ToastProvider>
  )
}
