'use client'

import { useEffect, useState } from 'react'

type Tema = 'light' | 'dark'

function temaEfectivo(): Tema {
  const attr = document.documentElement.dataset.theme
  if (attr === 'light' || attr === 'dark') return attr
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>('light')
  const [listo, setListo] = useState(false)

  useEffect(() => {
    setTema(temaEfectivo())
    setListo(true)
  }, [])

  function alternar() {
    const nuevo: Tema = tema === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = nuevo
    try {
      localStorage.setItem('theme', nuevo)
    } catch {
      // almacenamiento no disponible: el cambio aplica igual en esta sesión
    }
    setTema(nuevo)
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors active:text-[var(--color-accent)]"
    >
      {listo && tema === 'dark' ? <IconSol /> : <IconLuna />}
    </button>
  )
}

function IconSol() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function IconLuna() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}
