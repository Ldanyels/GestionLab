'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { crearUsuarioAction, type FormState } from '@/app/(app)/configuracion/usuarios/actions'

const initial: FormState = { error: '' }
const inputClass =
  'w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 outline-none focus:border-[var(--color-accent)]'
const labelText = 'text-sm text-[var(--color-muted)]'

export function UsuarioForm() {
  const [state, formAction, pending] = useActionState(crearUsuarioAction, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const prev = useRef(state)
  useEffect(() => {
    if (state !== prev.current && state.ok) formRef.current?.reset()
    prev.current = state
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <label className="block space-y-1">
        <span className={labelText}>Nombre</span>
        <input name="nombre" required placeholder="Nombre del usuario" className={inputClass} />
      </label>
      <label className="block space-y-1">
        <span className={labelText}>Correo (para iniciar sesión)</span>
        <input
          name="email"
          type="email"
          required
          placeholder="correo@ejemplo.com"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1">
        <span className={labelText}>Contraseña temporal</span>
        <PasswordInput name="password" autoComplete="new-password" required placeholder="Mínimo 6 caracteres" />
      </label>
      <label className="block space-y-1">
        <span className={labelText}>Rol</span>
        <select name="rol" defaultValue="tecnico" className={inputClass}>
          <option value="tecnico">Técnico (registra trabajos; sin finanzas ni inventario)</option>
          <option value="admin">Administrador (acceso total)</option>
        </select>
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-[var(--color-success)]">Usuario creado.</p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Creando…' : 'Crear usuario'}
      </Button>
    </form>
  )
}
