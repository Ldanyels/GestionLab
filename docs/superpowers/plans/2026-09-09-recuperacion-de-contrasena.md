# Recuperación de contraseña — Plan de implementación

> **Para trabajadores automáticos:** SUB-SKILL REQUERIDA: usar
> superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para implementar tarea por tarea. Los pasos usan
> casillas (`- [ ]`) para seguimiento.

**Objetivo:** Que un usuario pueda recuperar su contraseña desde el login, y que
un administrador pueda restablecer la de cualquier persona de su laboratorio.

**Arquitectura:** El enlace del correo lleva `token_hash` y la página lo valida
en el servidor con `verifyOtp`, no con el flujo PKCE, para que funcione cuando
el correo se abre en otro dispositivo. Las pantallas nuevas viven bajo
`/login/`, que `proxy.ts` ya deja pasar sin sesión. El restablecimiento por el
administrador reutiliza `perteneceALab`, así que nadie puede tocar usuarios de
otro laboratorio.

**Stack:** Next.js 16 (App Router, Server Actions), `@supabase/ssr` 0.12,
`@supabase/supabase-js` 2.110, Zod, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-09-recuperacion-clave-y-alta-laboratorios-design.md`

**Estado:** completado el 2026-09-09 en la rama `recuperacion-de-clave`, con una
desviación en la Tarea 5 — ver la nota en esa tarea.

## Restricciones globales

- Todo el texto de interfaz en **español**, tono conversacional, sentence case.
- Las Server Actions usan `intentar` / `intentarSinEstado` de `lib/acciones.ts`;
  **nunca** un `try/catch` a mano, y **ningún `redirect()` dentro** del
  envoltorio (`redirect` funciona lanzando una excepción).
- Contraseña mínima: **6 caracteres**, el mismo valor que ya usa
  `usuarioSchema` en `lib/usuarios/data.ts`.
- La pantalla de recuperación responde **lo mismo exista o no el correo**. Sin
  esto se convierte en un detector de quién tiene cuenta.
- Un administrador solo puede restablecer contraseñas de **su propio
  laboratorio**, comprobado con `perteneceALab` en el servidor.
- Ningún cambio en políticas RLS ni migraciones de base de datos.
- `pnpm test` debe quedar en verde tras cada tarea (401 pruebas de partida).

---

### Tarea 1: Esquemas de validación

**Archivos:**
- Crear: `lib/usuarios/recuperacion.ts`
- Probar: `lib/usuarios/recuperacion.test.ts`

**Interfaces:**
- Consume: nada.
- Produce: `correoSchema` (`{ email: string }`), `claveNuevaSchema`
  (`{ password: string; confirmacion: string }`), ambos de Zod.

- [ ] **Paso 1: Escribir la prueba que falla**

```ts
import { describe, it, expect } from 'vitest'
import { claveNuevaSchema, correoSchema } from './recuperacion'

describe('correoSchema', () => {
  it('acepta un correo válido y le quita los espacios', () => {
    expect(correoSchema.parse({ email: '  ana@lab.pe ' }).email).toBe('ana@lab.pe')
  })

  it('rechaza un correo inválido con mensaje en español', () => {
    const r = correoSchema.safeParse({ email: 'no-es-correo' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Correo inválido')
  })

  it('rechaza el correo vacío', () => {
    expect(correoSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

describe('claveNuevaSchema', () => {
  it('acepta dos contraseñas iguales de 6 o más caracteres', () => {
    expect(
      claveNuevaSchema.safeParse({ password: 'abc123', confirmacion: 'abc123' }).success,
    ).toBe(true)
  })

  it('exige al menos 6 caracteres, igual que al crear el usuario', () => {
    const r = claveNuevaSchema.safeParse({ password: 'abc12', confirmacion: 'abc12' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.issues[0]?.message).toBe('La contraseña debe tener al menos 6 caracteres')
  })

  it('rechaza cuando la confirmación no coincide', () => {
    const r = claveNuevaSchema.safeParse({ password: 'abc123', confirmacion: 'abc124' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Las contraseñas no coinciden')
  })

  it('no recorta la contraseña: los espacios son caracteres válidos', () => {
    const clave = '  hola  '
    const r = claveNuevaSchema.safeParse({ password: clave, confirmacion: clave })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.password).toBe(clave)
  })
})
```

- [ ] **Paso 2: Correrla y ver que falla**

Ejecutar: `pnpm vitest run lib/usuarios/recuperacion.test.ts`
Esperado: FALLA con "Failed to resolve import ./recuperacion".

- [ ] **Paso 3: Implementar**

```ts
import { z } from 'zod'

/** Correo para pedir el enlace de recuperación. */
export const correoSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
})

/**
 * Contraseña nueva y su confirmación.
 *
 * La contraseña NO se recorta: un espacio al principio o al final es un
 * carácter válido y recortarlo dejaría al usuario sin poder entrar con lo que
 * él cree que escribió.
 */
export const claveNuevaSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmacion: z.string(),
  })
  .refine((d) => d.password === d.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  })
```

- [ ] **Paso 4: Correrla y ver que pasa**

Ejecutar: `pnpm vitest run lib/usuarios/recuperacion.test.ts`
Esperado: PASA, 8 pruebas.

- [ ] **Paso 5: Confirmar**

```bash
git add lib/usuarios/recuperacion.ts lib/usuarios/recuperacion.test.ts
git commit -m "feat(recuperacion): esquemas de correo y contraseña nueva"
```

---

### Tarea 2: Pedir el enlace desde el login

**Archivos:**
- Crear: `app/(auth)/login/recuperar/page.tsx`
- Crear: `app/(auth)/login/recuperar/actions.ts`
- Modificar: `app/(auth)/login/page.tsx:69-74` (el texto muerto)

**Interfaces:**
- Consume: `correoSchema` de la Tarea 1.
- Produce: la ruta `/login/recuperar`; `pedirEnlaceAction(prev, formData)` con
  estado `{ error: string; enviado: boolean }`.

- [ ] **Paso 1: Escribir la acción**

```ts
'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { correoSchema } from '@/lib/usuarios/recuperacion'
import { registrarError } from '@/lib/registro'

export interface RecuperarState {
  error: string
  enviado: boolean
}

/** URL pública del sistema, para armar el destino del enlace. */
function sitio(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gestionlab.skardiam.com'
}

export async function pedirEnlaceAction(
  _prev: RecuperarState,
  formData: FormData,
): Promise<RecuperarState> {
  const parsed = correoSchema.safeParse({ email: String(formData.get('email') ?? '') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Correo inválido', enviado: false }
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${sitio()}/login/nueva-clave`,
  })

  // Se responde lo mismo exista o no la cuenta: si el resultado cambiara según
  // el correo, esta pantalla sería un detector de quién tiene cuenta. El fallo
  // real queda en el registro del servidor.
  if (error) registrarError('pedirEnlaceAction', error, 'fallo al pedir el enlace')

  return { error: '', enviado: true }
}
```

- [ ] **Paso 2: Escribir la pantalla**

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { pedirEnlaceAction, type RecuperarState } from './actions'
import { LogoDiente } from '@/components/nav/icons'

const initial: RecuperarState = { error: '', enviado: false }

const campo =
  'h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] outline-none focus:border-[var(--color-accent)]'

export default function RecuperarPage() {
  const [state, action, pending] = useActionState(pedirEnlaceAction, initial)

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <LogoDiente className="text-[var(--color-accent)]" width={24} height={24} />
          GestionLab
        </span>

        {state.enviado ? (
          <>
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
              Revisa tu correo
            </h1>
            <p className="text-[14.5px] leading-relaxed text-[var(--color-muted)]">
              Si esa dirección tiene una cuenta, te llegará un enlace para elegir una
              contraseña nueva. Vence en una hora y solo se puede usar una vez.
            </p>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[15px] font-semibold"
            >
              Volver a entrar
            </Link>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
                Recuperar contraseña
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Te mandamos un enlace al correo con el que entras.
              </p>
            </div>

            <form action={action} className="space-y-3.5">
              <label className="block space-y-1">
                <span className="text-[13px] font-semibold text-[var(--color-muted)]">
                  Correo
                </span>
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  required
                  className={campo}
                />
              </label>

              {state.error ? (
                <p role="alert" className="text-sm text-[var(--color-danger)]">
                  {state.error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="h-[50px] w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-base font-semibold text-[var(--color-accent-contrast)] transition-transform active:scale-[0.99] disabled:opacity-50"
              >
                {pending ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>

            <Link
              href="/login"
              className="block border-t border-[var(--color-border)] pt-3.5 text-[13px] text-[var(--color-accent)]"
            >
              ‹ Volver a entrar
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Paso 3: Reemplazar el texto muerto del login**

En `app/(auth)/login/page.tsx`, sustituir el bloque de las líneas 69-74 por:

```tsx
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3.5">
          <Link href="/login/recuperar" className="text-[13px] text-[var(--color-accent)]">
            ¿Olvidaste tu contraseña?
          </Link>
          <ThemeToggle />
        </div>
```

Y añadir el import al principio del archivo:

```tsx
import Link from 'next/link'
```

- [ ] **Paso 4: Comprobar que compila y que la suite sigue verde**

Ejecutar: `pnpm tsc --noEmit --pretty false 2>&1 | grep -v "inventario/__tests__"`
Esperado: sin errores nuevos.

Ejecutar: `pnpm test`
Esperado: 409 pruebas en verde (401 + las 8 de la Tarea 1).

- [ ] **Paso 5: Confirmar**

```bash
git add "app/(auth)/login/recuperar" "app/(auth)/login/page.tsx"
git commit -m "feat(recuperacion): pedir el enlace desde el login"
```

---

### Tarea 3: Elegir la contraseña nueva

**Archivos:**
- Crear: `app/(auth)/login/nueva-clave/page.tsx`
- Crear: `app/(auth)/login/nueva-clave/actions.ts`
- Crear: `components/usuarios/FormularioClaveNueva.tsx`
- Probar: `components/usuarios/FormularioClaveNueva.test.tsx`

**Interfaces:**
- Consume: `claveNuevaSchema` de la Tarea 1.
- Produce: la ruta `/login/nueva-clave`;
  `guardarClaveAction(prev, formData)` con estado `{ error: string }`;
  `<FormularioClaveNueva action={...} />`.

- [ ] **Paso 1: Escribir la prueba del formulario**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormularioClaveNueva } from './FormularioClaveNueva'

describe('FormularioClaveNueva', () => {
  it('pide la contraseña y su confirmación', () => {
    render(<FormularioClaveNueva action={vi.fn()} />)
    expect(screen.getByLabelText('Contraseña nueva')).toBeInTheDocument()
    expect(screen.getByLabelText('Repite la contraseña')).toBeInTheDocument()
  })

  it('avisa del mínimo de caracteres antes de intentar guardar', () => {
    render(<FormularioClaveNueva action={vi.fn()} />)
    expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument()
  })

  it('muestra el error que devuelve el servidor', () => {
    render(<FormularioClaveNueva action={vi.fn()} errorInicial="Las contraseñas no coinciden" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden')
  })

  it('envía los dos campos con los nombres que espera la acción', async () => {
    render(<FormularioClaveNueva action={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'abc123')
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'abc123')
    expect(screen.getByLabelText('Contraseña nueva')).toHaveAttribute('name', 'password')
    expect(screen.getByLabelText('Repite la contraseña')).toHaveAttribute(
      'name',
      'confirmacion',
    )
  })
})
```

- [ ] **Paso 2: Correrla y ver que falla**

Ejecutar: `pnpm vitest run components/usuarios/FormularioClaveNueva.test.tsx`
Esperado: FALLA con "Failed to resolve import ./FormularioClaveNueva".

- [ ] **Paso 3: Implementar el formulario**

```tsx
'use client'

import { useActionState } from 'react'

interface Props {
  action: (prev: { error: string }, formData: FormData) => Promise<{ error: string }>
  errorInicial?: string
}

const campo =
  'h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] outline-none focus:border-[var(--color-accent)]'
const etiqueta = 'text-[13px] font-semibold text-[var(--color-muted)]'

/**
 * Contraseña nueva y su confirmación.
 *
 * Los dos campos son `type="password"` normales, sin el botón de mostrar: aquí
 * el usuario está eligiendo una contraseña, no recordándola, y la confirmación
 * ya cumple la función de detectar el error de tecleo.
 */
export function FormularioClaveNueva({ action, errorInicial = '' }: Props) {
  const [state, enviar, pending] = useActionState(action, { error: errorInicial })
  const error = state.error || errorInicial

  return (
    <form action={enviar} className="space-y-3.5">
      <label className="block space-y-1">
        <span className={etiqueta}>Contraseña nueva</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className={campo}
        />
      </label>

      <label className="block space-y-1">
        <span className={etiqueta}>Repite la contraseña</span>
        <input
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className={campo}
        />
      </label>

      <p className="text-[12.5px] text-[var(--color-muted)]">
        Debe tener al menos 6 caracteres.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-[50px] w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-base font-semibold text-[var(--color-accent-contrast)] transition-transform active:scale-[0.99] disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  )
}
```

- [ ] **Paso 4: Correrla y ver que pasa**

Ejecutar: `pnpm vitest run components/usuarios/FormularioClaveNueva.test.tsx`
Esperado: PASA, 4 pruebas.

- [ ] **Paso 5: Escribir la acción que guarda**

```ts
'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { claveNuevaSchema } from '@/lib/usuarios/recuperacion'
import { intentar } from '@/lib/acciones'

export interface ClaveState {
  error: string
}

export async function guardarClaveAction(
  _prev: ClaveState,
  formData: FormData,
): Promise<ClaveState> {
  const parsed = claveNuevaSchema.safeParse({
    password: String(formData.get('password') ?? ''),
    confirmacion: String(formData.get('confirmacion') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createServerSupabase()
  const r = await intentar('guardarClaveAction', 'No se pudo guardar la contraseña', async () => {
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
    // `updateUser` devuelve el error en la respuesta en vez de lanzarlo, así
    // que hay que relanzarlo para que el envoltorio lo traduzca y registre.
    if (error) throw error
  })
  if (!r.ok) return r.estado

  // Fuera del envoltorio: `redirect` funciona lanzando una excepción y dentro
  // se confundiría con un fallo.
  redirect('/hoy')
}
```

- [ ] **Paso 6: Escribir la pantalla que valida el token**

```tsx
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { LogoDiente } from '@/components/nav/icons'
import { FormularioClaveNueva } from '@/components/usuarios/FormularioClaveNueva'
import { guardarClaveAction } from './actions'

/**
 * Destino del enlace del correo.
 *
 * Valida el token en el servidor con `verifyOtp` y no con el flujo PKCE: el
 * verificador de PKCE queda en el navegador que pidió el correo, así que pedir
 * el enlace en la computadora y abrirlo en el teléfono fallaría. `verifyOtp`
 * con `token_hash` no necesita verificador.
 */
export default async function NuevaClavePage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}) {
  const { token_hash, type } = await searchParams

  let valido = false
  if (token_hash && type === 'recovery') {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash })
    valido = !error
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <LogoDiente className="text-[var(--color-accent)]" width={24} height={24} />
          GestionLab
        </span>

        {valido ? (
          <>
            <div>
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
                Elige tu contraseña
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Con esta entrarás de ahora en adelante.
              </p>
            </div>
            <FormularioClaveNueva action={guardarClaveAction} />
          </>
        ) : (
          <>
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
              Este enlace ya no sirve
            </h1>
            <p className="text-[14.5px] leading-relaxed text-[var(--color-muted)]">
              Los enlaces vencen en una hora y solo se pueden usar una vez. Pide uno
              nuevo y vuelve a intentarlo.
            </p>
            <Link
              href="/login/recuperar"
              className="flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[15px] font-semibold text-[var(--color-accent-contrast)]"
            >
              Pedir otro enlace
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Paso 7: Comprobar tipos y suite**

Ejecutar: `pnpm tsc --noEmit --pretty false 2>&1 | grep -v "inventario/__tests__"`
Esperado: sin errores nuevos.

Ejecutar: `pnpm test`
Esperado: 413 pruebas en verde.

- [ ] **Paso 8: Confirmar**

```bash
git add "app/(auth)/login/nueva-clave" components/usuarios/FormularioClaveNueva.tsx components/usuarios/FormularioClaveNueva.test.tsx
git commit -m "feat(recuperacion): pantalla para elegir la contraseña nueva"
```

---

### Tarea 4: El administrador restablece una contraseña

**Archivos:**
- Modificar: `lib/usuarios/data.ts` (añadir `restablecerClave`)
- Modificar: `app/(app)/configuracion/usuarios/actions.ts`
- Modificar: `app/(app)/configuracion/usuarios/page.tsx`
- Crear: `components/usuarios/RestablecerClave.tsx`
- Probar: `components/usuarios/RestablecerClave.test.tsx`

**Interfaces:**
- Consume: `perteneceALab(id, labId)` y `laboratorioIdActual()`, ya existentes
  en `lib/usuarios/data.ts`; `claveNuevaSchema` de la Tarea 1.
- Produce: `restablecerClave(id: string, password: string): Promise<void>`;
  `restablecerClaveAction(prev, formData)` con estado `{ error: string; ok?: boolean }`;
  `<RestablecerClave usuarioId={...} nombre={...} />`.

- [ ] **Paso 1: Escribir la prueba del componente**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestablecerClave } from './RestablecerClave'

describe('RestablecerClave', () => {
  it('empieza cerrado, con solo el disparador', () => {
    render(<RestablecerClave usuarioId="u1" nombre="Lab kevin" />)
    expect(screen.getByRole('button', { name: /restablecer contraseña/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument()
  })

  it('al abrirlo pide la contraseña y dice de quién es', async () => {
    render(<RestablecerClave usuarioId="u1" nombre="Lab kevin" />)
    await userEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }))
    expect(screen.getByLabelText('Contraseña nueva')).toBeInTheDocument()
    expect(screen.getByText(/Lab kevin/)).toBeInTheDocument()
  })

  it('manda el identificador del usuario en un campo oculto', async () => {
    const { container } = render(<RestablecerClave usuarioId="u1" nombre="Lab kevin" />)
    await userEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }))
    const oculto = container.querySelector('input[type=hidden][name=id]')
    expect(oculto).toHaveAttribute('value', 'u1')
  })

  it('se puede cerrar sin guardar nada', async () => {
    render(<RestablecerClave usuarioId="u1" nombre="Lab kevin" />)
    await userEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument()
  })
})
```

- [ ] **Paso 2: Correrla y ver que falla**

Ejecutar: `pnpm vitest run components/usuarios/RestablecerClave.test.tsx`
Esperado: FALLA con "Failed to resolve import ./RestablecerClave".

- [ ] **Paso 3: Añadir la función de datos**

Al final de `lib/usuarios/data.ts`:

```ts
/**
 * Fija una contraseña nueva para un usuario del propio laboratorio.
 *
 * El administrador la escribe y se aplica: es coherente con `crearUsuario`,
 * donde el administrador también fija la contraseña inicial, y con un
 * laboratorio de pocas personas donde el técnico está presente.
 *
 * `perteneceALab` es la barrera real: sin ella un administrador podría
 * cambiarle la contraseña a un usuario de otro laboratorio pasando su id.
 */
export async function restablecerClave(id: string, password: string): Promise<void> {
  const labId = await laboratorioIdActual()
  if (!(await perteneceALab(id, labId))) return

  const admin = createAdminSupabase()
  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) throw new Error(error.message)
}
```

- [ ] **Paso 4: Implementar el componente**

```tsx
'use client'

import { useActionState, useState } from 'react'
import { restablecerClaveAction } from '@/app/(app)/configuracion/usuarios/actions'

const campo =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]'

/**
 * Restablece la contraseña de un usuario del laboratorio.
 *
 * Empieza cerrado a propósito: en la lista de usuarios hay una fila por
 * persona, y desplegar tres campos en cada una convertiría la pantalla en un
 * muro de formularios.
 */
export function RestablecerClave({
  usuarioId,
  nombre,
}: {
  usuarioId: string
  nombre: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [state, action, pending] = useActionState(restablecerClaveAction, { error: '' })

  if (state.ok && abierto) {
    return (
      <p className="text-xs text-[var(--color-success)]">Contraseña actualizada.</p>
    )
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-xs text-[var(--color-accent)]"
      >
        Restablecer contraseña
      </button>
    )
  }

  return (
    <form action={action} className="w-full space-y-2">
      <input type="hidden" name="id" value={usuarioId} />
      <p className="text-xs text-[var(--color-muted)]">
        Contraseña nueva para <span className="font-semibold">{nombre}</span>
      </p>

      <label className="block space-y-1">
        <span className="sr-only">Contraseña nueva</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          placeholder="Contraseña nueva"
          aria-label="Contraseña nueva"
          className={campo}
        />
      </label>

      <label className="block space-y-1">
        <span className="sr-only">Repite la contraseña</span>
        <input
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          placeholder="Repítela"
          aria-label="Repite la contraseña"
          className={campo}
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-xs text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-9 flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-xs font-semibold text-[var(--color-accent-contrast)] disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-xs"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Paso 5: Correrla y ver que pasa**

Ejecutar: `pnpm vitest run components/usuarios/RestablecerClave.test.tsx`
Esperado: PASA, 4 pruebas.

- [ ] **Paso 6: Añadir la Server Action**

En `app/(app)/configuracion/usuarios/actions.ts`, añadir el import de
`restablecerClave` y `claveNuevaSchema`, y la acción:

```ts
export async function restablecerClaveAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Falta el usuario' }

  const parsed = claveNuevaSchema.safeParse({
    password: String(formData.get('password') ?? ''),
    confirmacion: String(formData.get('confirmacion') ?? ''),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const r = await intentar(
    'restablecerClaveAction',
    'No se pudo cambiar la contraseña',
    () => restablecerClave(id, parsed.data.password),
  )
  if (!r.ok) return r.estado

  revalidatePath('/configuracion/usuarios')
  return { error: '', ok: true }
}
```

- [ ] **Paso 7: Mostrarlo en la pantalla de usuarios**

En `app/(app)/configuracion/usuarios/page.tsx`, importar
`RestablecerClave` y añadirlo dentro del bloque `<>...</>` que hoy contiene el
selector de rol y el `ConfirmDialog`, justo antes del `ConfirmDialog`:

```tsx
                      <RestablecerClave usuarioId={u.id} nombre={u.nombre} />
```

- [ ] **Paso 8: Comprobar tipos, suite y compilación**

Ejecutar: `pnpm tsc --noEmit --pretty false 2>&1 | grep -v "inventario/__tests__"`
Esperado: sin errores nuevos.

Ejecutar: `pnpm test`
Esperado: 417 pruebas en verde.

Ejecutar: `pnpm build`
Esperado: "✓ Compiled successfully".

- [ ] **Paso 9: Confirmar**

```bash
git add lib/usuarios/data.ts "app/(app)/configuracion/usuarios" components/usuarios/RestablecerClave.tsx components/usuarios/RestablecerClave.test.tsx
git commit -m "feat(usuarios): el administrador puede restablecer la contraseña de su equipo"
```

---

### Tarea 5: Aviso de catálogo vacío

**Archivos:**
- Modificar: `app/(app)/trabajos/nuevo/page.tsx`

**Interfaces:**
- Consume: `listCatalogo()` de `lib/catalogo/data.ts`, ya usada por esa página.
- Produce: nada que consuman otras tareas.

Está en este plan porque los laboratorios nuevos arrancan con catálogo vacío
(decisión del cliente) y `trabajo` exige `catalogo_trabajo_id`: sin este aviso,
el primer día de un laboratorio nuevo es un formulario que no se puede enviar y
no explica por qué.

> **Desviación al ejecutar (2026-09-09).** La premisa era falsa: la página ya
> avisaba del catálogo vacío y enlazaba a configurarlo. Debí leerla antes de
> planificar la tarea.
>
> Al leerla apareció un problema real y distinto: el aviso enlazaba a
> `/configuracion/catalogo`, que exige rol admin, así que un técnico tocaba
> "Configura el catálogo" y volvía a Hoy sin explicación. Se implementó eso en
> su lugar — mensaje según el rol, sin enlace muerto para el técnico— más una
> pasada de redacción para dejar de hablar como el sistema ("Falta información
> base" → "Antes de crear un trabajo").

- [ ] **Paso 1: Ver cómo está hoy**

Ejecutar: `sed -n '1,40p' "app/(app)/trabajos/nuevo/page.tsx"`
Objetivo: localizar dónde se obtiene el catálogo y qué se renderiza.

- [ ] **Paso 2: Añadir el corto por catálogo vacío**

Justo después de obtener los tipos del catálogo, antes de renderizar el
formulario, insertar:

```tsx
  if (tipos.length === 0) {
    return (
      <section className="mx-auto max-w-[620px] space-y-4">
        <BackRow href="/trabajos" migaDePan="Trabajos" titulo="Nuevo trabajo" />
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">Primero crea un tipo de trabajo</p>
          <p className="mx-auto mt-1 max-w-[38ch] text-[13.5px] leading-relaxed text-[var(--color-muted)]">
            Un trabajo siempre es de algún tipo —una corona, una base metálica— con su
            precio. Registra los que hace tu laboratorio y vuelve aquí.
          </p>
          <Link
            href="/configuracion/catalogo/nuevo"
            className="mt-4 inline-flex h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-accent-contrast)]"
          >
            Crear tipo de trabajo
          </Link>
        </div>
      </section>
    )
  }
```

Ajustar el nombre de la variable (`tipos`) al que use el archivo, y añadir los
imports de `Link` y `BackRow` si no están.

- [ ] **Paso 3: Comprobar tipos y compilación**

Ejecutar: `pnpm tsc --noEmit --pretty false 2>&1 | grep -v "inventario/__tests__"`
Esperado: sin errores nuevos.

Ejecutar: `pnpm build`
Esperado: "✓ Compiled successfully".

- [ ] **Paso 4: Confirmar**

```bash
git add "app/(app)/trabajos/nuevo/page.tsx"
git commit -m "feat(trabajos): explicar que falta el catálogo en vez de mostrar un formulario inservible"
```

---

### Tarea 6: Documentar la variable del sitio y verificar de punta a punta

**Archivos:**
- Modificar: `.env.example`
- Modificar: `docs/supabase-setup.md`

- [ ] **Paso 1: Añadir la variable a `.env.example`**

```
# URL pública del sistema. La usa el enlace del correo de recuperación.
NEXT_PUBLIC_SITE_URL=https://gestionlab.skardiam.com
```

- [ ] **Paso 2: Documentar la configuración de correo**

Añadir al final de `docs/supabase-setup.md` una sección "7. Correo
transaccional" con los valores de SMTP de Resend, la Site URL, las Redirect
URLs y la referencia a `docs/correo/plantilla-restablecer-clave.html`.

- [ ] **Paso 3: Prueba manual, la que ninguna prueba automática cubre**

Con la rama fusionada y desplegada:

1. Entrar a `https://gestionlab.skardiam.com/login` y tocar "¿Olvidaste tu
   contraseña?".
2. Pedir el enlace con un correo real del laboratorio.
3. **Abrir el correo en otro dispositivo** (el teléfono, si el enlace se pidió
   en la computadora). Este es el caso que el flujo PKCE rompía y la razón de
   usar `verifyOtp`.
4. Elegir una contraseña nueva y comprobar que entra.
5. Pedir un enlace con un correo que **no** exista y comprobar que la respuesta
   es idéntica.
6. Volver a abrir el enlace ya usado y comprobar que aparece "Este enlace ya no
   sirve".

- [ ] **Paso 4: Confirmar**

```bash
git add .env.example docs/supabase-setup.md
git commit -m "docs(correo): documentar la URL del sitio y la configuración de SMTP"
```

---

## Revisión del plan contra el spec

**Cobertura.** §5.1 plantilla → ya está en `docs/correo/`, referenciada en la
Tarea 6. §5.2 autoservicio → Tareas 2 y 3. §5.3 restablecimiento por el
administrador → Tarea 4. §5.4 catálogo vacío → Tarea 5. §4 infraestructura →
hecha por el cliente y verificada con `scripts/verificar-dominio.mjs`. §7 manejo
de errores → `intentar` y `registrarError` en las Tareas 2, 3 y 4. §8 pruebas →
las unitarias en cada tarea y la manual en la Tarea 6.

**Fuera de este plan, por diseño:** el subproyecto 2 (panel de
super-administrador y alta de laboratorios) tiene su propio plan. La suite
`scripts/probar-aislamiento.mjs` no se toca aquí porque este plan no cambia
ninguna política RLS.

**Consistencia de nombres.** `correoSchema` y `claveNuevaSchema` (Tarea 1) se
usan con esos nombres en las Tareas 2, 3 y 4. `restablecerClave(id, password)`
(Tarea 4, paso 3) se invoca con esa firma en el paso 6. El estado de formulario
de la pantalla de usuarios es `FormState { error: string; ok?: boolean }`, el
que ya existe en ese archivo, y `RestablecerClave` lee `state.ok`.
