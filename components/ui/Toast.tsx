'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const DURACION = 2200

const Contexto = createContext<(mensaje: string) => void>(() => {})

/** Muestra un aviso breve: `const avisar = useToast(); avisar('Guardado')`. */
export function useToast(): (mensaje: string) => void {
  return useContext(Contexto)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mensaje, setMensaje] = useState<string | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  const avisar = useCallback((texto: string) => {
    setMensaje(texto)
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setMensaje(null), DURACION)
  }, [])

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current)
    },
    [],
  )

  return (
    <Contexto.Provider value={avisar}>
      {children}
      {mensaje ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[60] flex justify-center px-4 motion-safe:animate-[pop_150ms_ease-out]"
        >
          <p className="rounded-full bg-[var(--color-text)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] shadow-[var(--shadow-pop)]">
            {mensaje}
          </p>
        </div>
      ) : null}
    </Contexto.Provider>
  )
}
