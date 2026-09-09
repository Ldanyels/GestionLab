# Panel de plataforma y alta de laboratorios — Plan de implementación

> **Para trabajadores automáticos:** SUB-SKILL REQUERIDA: usar
> superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para implementar tarea por tarea. Los pasos usan
> casillas (`- [ ]`) para seguimiento.

**Objetivo:** Dar de alta un laboratorio con su administrador desde una
pantalla, y poder suspenderlo o reactivarlo, sin correr SQL a mano.

**Arquitectura:** El panel vive en su propio grupo de rutas `(plataforma)` y
usa **exclusivamente la clave de servicio en el servidor**. No se relaja
ninguna política RLS: el poder del super-administrador viene del servidor, no
de un agujero en las políticas. El rol se identifica por variable de entorno y
no por una fila en la base, para que un fallo de la clase de
`perfil_self_insert` no pueda otorgarlo.

**Stack:** Next.js 16 (App Router, Server Actions), `@supabase/supabase-js`
2.110 con clave de servicio, Zod, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-09-recuperacion-clave-y-alta-laboratorios-design.md` (§6)

## Restricciones globales

- **Ninguna política RLS cambia, ninguna migración.** Criterio de aceptación:
  `CONFIRMO=si pnpm test:aislamiento` debe seguir dando **132 de 132 sin
  modificar el script**. Si alguien propone una política tipo
  `using (es_superadmin())`, esa suite empezará a fallar, y eso es la señal de
  que la propuesta está mal.
- El super-administrador se identifica por `SUPERADMIN_EMAILS` (correos
  separados por coma). **Si la variable falta o está vacía, nadie es
  super-administrador**: la ausencia de configuración no concede acceso.
- Todo el texto de interfaz en **español**, tono conversacional, sentence case.
- Las Server Actions usan `intentar` / `intentarSinEstado` de `lib/acciones.ts`;
  ningún `redirect()` dentro del envoltorio.
- Los laboratorios nuevos arrancan **con catálogo vacío** (decisión del
  cliente). No se siembra nada.
- `pnpm test` en verde tras cada tarea (418 pruebas de partida).

---

### Tarea 1: Quién es super-administrador

**Archivos:**
- Crear: `lib/plataforma/acceso.ts`
- Probar: `lib/plataforma/acceso.test.ts`

**Interfaces:**
- Consume: `getSessionContext` de `lib/auth.ts` (para el patrón de leer el
  claim); `createServerSupabase` de `lib/supabase/server.ts`.
- Produce:
  - `esSuperAdmin(email: string | null | undefined, lista?: string): boolean` — pura
  - `correoSesion(): Promise<string | null>`
  - `esSesionSuperAdmin(): Promise<boolean>`
  - `requireSuperAdmin(): Promise<void>` — redirige a `/hoy` si no lo es

- [ ] **Paso 1: Escribir la prueba de la función pura**

```ts
import { describe, it, expect } from 'vitest'
import { esSuperAdmin } from './acceso'

const LISTA = 'jefe@skardiam.com, otro@skardiam.com'

describe('esSuperAdmin', () => {
  it('reconoce un correo de la lista', () => {
    expect(esSuperAdmin('jefe@skardiam.com', LISTA)).toBe(true)
    expect(esSuperAdmin('otro@skardiam.com', LISTA)).toBe(true)
  })

  it('rechaza a quien no está', () => {
    expect(esSuperAdmin('ajeno@ejemplo.com', LISTA)).toBe(false)
  })

  it('no distingue mayúsculas ni espacios sobrantes', () => {
    expect(esSuperAdmin('  JEFE@Skardiam.COM  ', LISTA)).toBe(true)
  })

  // Lo más importante de esta función: si no hay configuración, nadie entra.
  it('sin lista configurada nadie es super-administrador', () => {
    expect(esSuperAdmin('jefe@skardiam.com', undefined)).toBe(false)
    expect(esSuperAdmin('jefe@skardiam.com', '')).toBe(false)
    expect(esSuperAdmin('jefe@skardiam.com', '   ')).toBe(false)
  })

  it('sin correo tampoco', () => {
    expect(esSuperAdmin(null, LISTA)).toBe(false)
    expect(esSuperAdmin(undefined, LISTA)).toBe(false)
    expect(esSuperAdmin('', LISTA)).toBe(false)
  })

  it('una lista con entradas vacías no abre la puerta', () => {
    expect(esSuperAdmin('', ',, ,')).toBe(false)
    expect(esSuperAdmin('x@y.com', ',,')).toBe(false)
  })

  it('acepta un solo correo sin comas', () => {
    expect(esSuperAdmin('solo@skardiam.com', 'solo@skardiam.com')).toBe(true)
  })

  it('no acepta coincidencias parciales', () => {
    expect(esSuperAdmin('jefe@skardiam.com.mx', LISTA)).toBe(false)
    expect(esSuperAdmin('nojefe@skardiam.com', LISTA)).toBe(false)
  })
})
```

- [ ] **Paso 2: Correrla y ver que falla**

Ejecutar: `pnpm vitest run lib/plataforma/acceso.test.ts`
Esperado: FALLA con "Failed to resolve import ./acceso".

- [ ] **Paso 3: Implementar**

```ts
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * ¿Este correo administra la plataforma?
 *
 * La lista vive en la variable de entorno `SUPERADMIN_EMAILS` y no en una fila
 * de la base, a propósito: si el rol fuera un dato, un fallo de la clase de
 * `perfil_self_insert` —el agujero que cerró la migración 0018— podría
 * otorgarlo. Una variable de entorno no se escala desde SQL.
 *
 * `lista` se recibe por parámetro para poder probar la función sin tocar el
 * entorno del proceso.
 */
export function esSuperAdmin(
  email: string | null | undefined,
  lista: string | undefined = process.env.SUPERADMIN_EMAILS,
): boolean {
  const buscado = email?.trim().toLowerCase()
  if (!buscado) return false

  const permitidos = (lista ?? '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)

  // Sin configuración nadie entra: la ausencia de una lista no puede
  // interpretarse como "todos".
  if (permitidos.length === 0) return false

  return permitidos.includes(buscado)
}

/**
 * Correo del usuario de la sesión.
 *
 * Se toma del claim `email`, que ya se verifica localmente en cada petición,
 * con respaldo en `getUser()` si la verificación local no está disponible. Es
 * el mismo patrón que `idUsuario` en `lib/auth.ts`, para no añadir un viaje de
 * red por navegación.
 */
export async function correoSesion(): Promise<string | null> {
  const supabase = await createServerSupabase()
  try {
    const { data, error } = await supabase.auth.getClaims()
    const email = data?.claims?.email
    if (!error && typeof email === 'string') return email
  } catch {
    // Sin verificación local disponible: se usa el respaldo por red.
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.email ?? null
}

export async function esSesionSuperAdmin(): Promise<boolean> {
  return esSuperAdmin(await correoSesion())
}

/** Exige rol de plataforma. Manda a /hoy a cualquier otro. */
export async function requireSuperAdmin(): Promise<void> {
  if (!(await esSesionSuperAdmin())) redirect('/hoy')
}
```

- [ ] **Paso 4: Correrla y ver que pasa**

Ejecutar: `pnpm vitest run lib/plataforma/acceso.test.ts`
Esperado: PASA, 8 pruebas.

- [ ] **Paso 5: Confirmar**

```bash
git add lib/plataforma/acceso.ts lib/plataforma/acceso.test.ts
git commit -m "feat(plataforma): identificar al super-administrador por variable de entorno"
```

---

### Tarea 2: Datos de laboratorios

**Archivos:**
- Crear: `lib/plataforma/laboratorios.ts`
- Probar: `lib/plataforma/laboratorios.test.ts` (solo el esquema; el resto se
  verifica de punta a punta en la Tarea 4)

**Interfaces:**
- Consume: `createAdminSupabase()` de `lib/supabase/admin.ts`.
- Produce:
  - `laboratorioNuevoSchema` — Zod, con `laboratorio`, `adminNombre`, `adminEmail`, `adminPassword`
  - `LaboratorioFila { id, nombre, plan, estado, creado_en, usuarios, trabajos }`
  - `listarLaboratorios(): Promise<LaboratorioFila[]>`
  - `crearLaboratorioConAdmin(input): Promise<{ laboratorioId: string }>`
  - `cambiarEstadoLaboratorio(id, estado): Promise<void>`

- [ ] **Paso 1: Escribir la prueba del esquema**

```ts
import { describe, it, expect } from 'vitest'
import { laboratorioNuevoSchema } from './laboratorios'

const valido = {
  laboratorio: 'Dental Sur',
  adminNombre: 'Ana Torres',
  adminEmail: 'ana@dentalsur.pe',
  adminPassword: 'abc123',
}

describe('laboratorioNuevoSchema', () => {
  it('acepta los datos completos y recorta los espacios', () => {
    const r = laboratorioNuevoSchema.parse({ ...valido, laboratorio: '  Dental Sur  ' })
    expect(r.laboratorio).toBe('Dental Sur')
  })

  it('exige el nombre del laboratorio', () => {
    const r = laboratorioNuevoSchema.safeParse({ ...valido, laboratorio: '  ' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('El nombre del laboratorio es obligatorio')
  })

  it('exige el nombre del administrador', () => {
    expect(laboratorioNuevoSchema.safeParse({ ...valido, adminNombre: '' }).success).toBe(false)
  })

  it('valida el correo', () => {
    const r = laboratorioNuevoSchema.safeParse({ ...valido, adminEmail: 'no-es-correo' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Correo inválido')
  })

  it('exige el mismo mínimo de contraseña que el resto del sistema', () => {
    const r = laboratorioNuevoSchema.safeParse({ ...valido, adminPassword: 'abc12' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.issues[0]?.message).toBe('La contraseña debe tener al menos 6 caracteres')
  })

  it('no recorta la contraseña', () => {
    const clave = '  hola  '
    const r = laboratorioNuevoSchema.parse({ ...valido, adminPassword: clave })
    expect(r.adminPassword).toBe(clave)
  })
})
```

- [ ] **Paso 2: Correrla y ver que falla**

Ejecutar: `pnpm vitest run lib/plataforma/laboratorios.test.ts`
Esperado: FALLA con "Failed to resolve import ./laboratorios".

- [ ] **Paso 3: Implementar**

```ts
import { z } from 'zod'
import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Laboratorio } from '@/lib/supabase/types'

export const laboratorioNuevoSchema = z.object({
  laboratorio: z.string().trim().min(1, 'El nombre del laboratorio es obligatorio').max(120),
  adminNombre: z.string().trim().min(1, 'El nombre del administrador es obligatorio').max(120),
  adminEmail: z.string().trim().email('Correo inválido'),
  // No se recorta, igual que en el resto del sistema: un espacio es un
  // carácter válido de la contraseña.
  adminPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})
export type LaboratorioNuevo = z.infer<typeof laboratorioNuevoSchema>

export interface LaboratorioFila extends Laboratorio {
  creado_en: string
  usuarios: number
  trabajos: number
}

/**
 * Todos los laboratorios de la plataforma, con cuántos usuarios y trabajos
 * tiene cada uno.
 *
 * Usa la clave de servicio porque tiene que ver TODOS los inquilinos, que es
 * justo lo que las políticas RLS impiden. El poder viene del servidor, no de
 * relajar una política: por eso la suite de aislamiento sigue pasando igual.
 */
export async function listarLaboratorios(): Promise<LaboratorioFila[]> {
  const admin = createAdminSupabase()
  const { data, error } = await admin
    .from('laboratorio')
    .select('id, nombre, plan, estado, creado_en, perfil(count), trabajo(count)')
    .order('creado_en', { ascending: true })
  if (error) throw new Error(error.message)

  type Cruda = Omit<LaboratorioFila, 'usuarios' | 'trabajos'> & {
    perfil: { count: number }[] | null
    trabajo: { count: number }[] | null
  }

  return ((data ?? []) as Cruda[]).map((l) => ({
    id: l.id,
    nombre: l.nombre,
    plan: l.plan,
    estado: l.estado,
    creado_en: l.creado_en,
    usuarios: l.perfil?.[0]?.count ?? 0,
    trabajos: l.trabajo?.[0]?.count ?? 0,
  }))
}

/**
 * Crea un laboratorio con su administrador: tres cosas que deben quedar todas
 * o ninguna.
 *
 * **No es una transacción de base de datos.** Crear el usuario de
 * autenticación es una llamada a otro servicio y no participa del
 * BEGIN/COMMIT de PostgreSQL, así que la reversión es explícita y el orden
 * importa: primero lo que se puede deshacer barato.
 */
export async function crearLaboratorioConAdmin(
  input: LaboratorioNuevo,
): Promise<{ laboratorioId: string }> {
  const admin = createAdminSupabase()

  const { data: lab, error: errLab } = await admin
    .from('laboratorio')
    .insert({ nombre: input.laboratorio })
    .select('id')
    .single()
  if (errLab) throw new Error(errLab.message)
  const laboratorioId = (lab as { id: string }).id

  const { data: creado, error: errUsuario } = await admin.auth.admin.createUser({
    email: input.adminEmail,
    password: input.adminPassword,
    email_confirm: true,
  })
  if (errUsuario) {
    await admin.from('laboratorio').delete().eq('id', laboratorioId)
    // Los correos son únicos en todo el proyecto, no por laboratorio: hay que
    // decir que ya tiene cuenta en otro sitio, no dar un genérico.
    throw new Error(
      errUsuario.message.includes('already')
        ? 'Ese correo ya tiene una cuenta en la plataforma'
        : errUsuario.message,
    )
  }
  const usuarioId = creado.user!.id

  const { error: errPerfil } = await admin.from('perfil').insert({
    id: usuarioId,
    laboratorio_id: laboratorioId,
    nombre: input.adminNombre,
    rol: 'admin',
  })
  if (errPerfil) {
    await admin.auth.admin.deleteUser(usuarioId)
    await admin.from('laboratorio').delete().eq('id', laboratorioId)
    throw new Error(errPerfil.message)
  }

  return { laboratorioId }
}

export async function cambiarEstadoLaboratorio(
  id: string,
  estado: Laboratorio['estado'],
): Promise<void> {
  const admin = createAdminSupabase()
  const { error } = await admin.from('laboratorio').update({ estado }).eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **Paso 4: Correrla y ver que pasa**

Ejecutar: `pnpm vitest run lib/plataforma/laboratorios.test.ts`
Esperado: PASA, 6 pruebas.

- [ ] **Paso 5: Confirmar**

```bash
git add lib/plataforma/laboratorios.ts lib/plataforma/laboratorios.test.ts
git commit -m "feat(plataforma): datos de laboratorios con alta transaccional y reversión"
```

---

### Tarea 3: El panel y sus acciones

**Archivos:**
- Crear: `app/(plataforma)/layout.tsx`
- Crear: `app/(plataforma)/plataforma/page.tsx`
- Crear: `app/(plataforma)/plataforma/actions.ts`
- Crear: `components/plataforma/FilaLaboratorio.tsx`
- Probar: `components/plataforma/FilaLaboratorio.test.tsx`

**Interfaces:**
- Consume: `requireSuperAdmin()` (Tarea 1); `listarLaboratorios()`,
  `cambiarEstadoLaboratorio()`, `LaboratorioFila` (Tarea 2).
- Produce: la ruta `/plataforma`; `cambiarEstadoAction(formData): Promise<void>`;
  `<FilaLaboratorio lab={...} />`.

- [ ] **Paso 1: Escribir la prueba de la fila**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FilaLaboratorio } from './FilaLaboratorio'
import type { LaboratorioFila } from '@/lib/plataforma/laboratorios'

function lab(p: Partial<LaboratorioFila> = {}): LaboratorioFila {
  return {
    id: 'l1',
    nombre: 'MasterLab',
    plan: 'gratis',
    estado: 'activo',
    creado_en: '2026-07-13T10:00:00Z',
    usuarios: 4,
    trabajos: 20,
    ...p,
  }
}

describe('FilaLaboratorio', () => {
  it('muestra el nombre y el recuento de usuarios y trabajos', () => {
    render(<FilaLaboratorio lab={lab()} />)
    expect(screen.getByText('MasterLab')).toBeInTheDocument()
    expect(screen.getByText(/4 usuarios/)).toBeInTheDocument()
    expect(screen.getByText(/20 trabajos/)).toBeInTheDocument()
  })

  it('usa el singular cuando corresponde', () => {
    render(<FilaLaboratorio lab={lab({ usuarios: 1, trabajos: 1 })} />)
    expect(screen.getByText(/1 usuario ·/)).toBeInTheDocument()
    expect(screen.getByText(/1 trabajo$/)).toBeInTheDocument()
  })

  it('a un laboratorio activo le ofrece suspender', () => {
    render(<FilaLaboratorio lab={lab({ estado: 'activo' })} />)
    expect(screen.getByRole('button', { name: /suspender/i })).toBeInTheDocument()
  })

  it('a un laboratorio suspendido lo marca y le ofrece reactivar', () => {
    render(<FilaLaboratorio lab={lab({ estado: 'suspendido' })} />)
    expect(screen.getByText('Suspendido')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reactivar/i })).toBeInTheDocument()
  })

  it('distingue el plan de cortesía del pagado', () => {
    render(<FilaLaboratorio lab={lab({ plan: 'gratis' })} />)
    expect(screen.getByText('Cortesía')).toBeInTheDocument()
  })

  it('manda el id y el estado destino en campos ocultos', () => {
    const { container } = render(<FilaLaboratorio lab={lab({ estado: 'activo' })} />)
    expect(container.querySelector('input[name=id]')).toHaveAttribute('value', 'l1')
    expect(container.querySelector('input[name=estado]')).toHaveAttribute(
      'value',
      'suspendido',
    )
  })
})
```

- [ ] **Paso 2: Correrla y ver que falla**

Ejecutar: `pnpm vitest run components/plataforma/FilaLaboratorio.test.tsx`
Esperado: FALLA con "Failed to resolve import ./FilaLaboratorio".

- [ ] **Paso 3: Implementar la fila**

```tsx
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { cambiarEstadoAction } from '@/app/(plataforma)/plataforma/actions'
import type { LaboratorioFila } from '@/lib/plataforma/laboratorios'

/** Un laboratorio en la lista de la plataforma, con su acción de estado. */
export function FilaLaboratorio({ lab }: { lab: LaboratorioFila }) {
  const activo = lab.estado === 'activo'
  const destino = activo ? 'suspendido' : 'activo'

  return (
    <Card tono="lista" className="space-y-3 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15.5px] font-semibold">{lab.nombre}</p>
          <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">
            {lab.usuarios} {lab.usuarios === 1 ? 'usuario' : 'usuarios'} ·{' '}
            {lab.trabajos} {lab.trabajos === 1 ? 'trabajo' : 'trabajos'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {activo ? null : <Chip tono="peligro">Suspendido</Chip>}
          <Chip tono={lab.plan === 'pagado' ? 'exito' : 'neutro'}>
            {lab.plan === 'pagado' ? 'Pagado' : 'Cortesía'}
          </Chip>
        </div>
      </div>

      <form action={cambiarEstadoAction} className="border-t border-[var(--color-border)] pt-3">
        <input type="hidden" name="id" value={lab.id} />
        <input type="hidden" name="estado" value={destino} />
        <button
          type="submit"
          className={`text-[13px] font-semibold ${
            activo ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'
          }`}
        >
          {activo ? 'Suspender acceso' : 'Reactivar acceso'}
        </button>
      </form>
    </Card>
  )
}
```

- [ ] **Paso 4: Correrla y ver que pasa**

Ejecutar: `pnpm vitest run components/plataforma/FilaLaboratorio.test.tsx`
Esperado: PASA, 6 pruebas.

- [ ] **Paso 5: Escribir la acción**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from '@/lib/plataforma/acceso'
import { cambiarEstadoLaboratorio } from '@/lib/plataforma/laboratorios'
import { intentarSinEstado } from '@/lib/acciones'

export async function cambiarEstadoAction(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const id = String(formData.get('id') ?? '')
  const estado = String(formData.get('estado') ?? '')
  if (!id || (estado !== 'activo' && estado !== 'suspendido')) return

  await intentarSinEstado(
    'cambiarEstadoAction',
    'No se pudo cambiar el estado del laboratorio',
    () => cambiarEstadoLaboratorio(id, estado),
  )

  revalidatePath('/plataforma')
}
```

- [ ] **Paso 6: Escribir el layout y la lista**

`app/(plataforma)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { requireSuperAdmin } from '@/lib/plataforma/acceso'

/**
 * Grupo de rutas del panel de plataforma.
 *
 * Sin la barra lateral de la aplicación a propósito: esto no pertenece a
 * ningún laboratorio. La guardia va aquí, en el servidor, así que cubre todas
 * las páginas del grupo sin repetirla en cada una.
 */
export default async function PlataformaLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin()
  return <div className="mx-auto w-full max-w-[720px] px-4 py-6">{children}</div>
}
```

`app/(plataforma)/plataforma/page.tsx`:

```tsx
import Link from 'next/link'
import { listarLaboratorios } from '@/lib/plataforma/laboratorios'
import { FilaLaboratorio } from '@/components/plataforma/FilaLaboratorio'

export default async function PlataformaPage() {
  const laboratorios = await listarLaboratorios()
  const activos = laboratorios.filter((l) => l.estado === 'activo').length

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent)]">
            Plataforma
          </p>
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">
            Laboratorios
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            {laboratorios.length} en total · {activos} con acceso
          </p>
        </div>
        <Link
          href="/plataforma/nuevo"
          className="inline-flex h-11 shrink-0 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)]"
        >
          + Nuevo
        </Link>
      </header>

      {laboratorios.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[15px] font-semibold">Todavía no hay laboratorios</p>
          <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
            Toca «+ Nuevo» para dar de alta el primero.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {laboratorios.map((l) => (
            <li key={l.id}>
              <FilaLaboratorio lab={l} />
            </li>
          ))}
        </ul>
      )}

      <Link href="/hoy" className="inline-block text-[13.5px] text-[var(--color-accent)]">
        ‹ Volver a mi laboratorio
      </Link>
    </section>
  )
}
```

- [ ] **Paso 7: Comprobar tipos, suite y compilación**

Ejecutar: `pnpm tsc --noEmit --pretty false 2>&1 | grep -v "inventario/__tests__"`
Esperado: sin errores nuevos.

Ejecutar: `pnpm test`
Esperado: 438 pruebas en verde.

Ejecutar: `pnpm build`
Esperado: "✓ Compiled successfully".

- [ ] **Paso 8: Confirmar**

```bash
git add "app/(plataforma)" components/plataforma
git commit -m "feat(plataforma): panel con la lista de laboratorios y su estado"
```

---

### Tarea 4: Alta de laboratorio desde el panel

**Archivos:**
- Crear: `app/(plataforma)/plataforma/nuevo/page.tsx`
- Crear: `components/plataforma/FormularioLaboratorio.tsx`
- Probar: `components/plataforma/FormularioLaboratorio.test.tsx`
- Modificar: `app/(plataforma)/plataforma/actions.ts` (añadir el alta)

**Interfaces:**
- Consume: `laboratorioNuevoSchema`, `crearLaboratorioConAdmin` (Tarea 2);
  `requireSuperAdmin` (Tarea 1).
- Produce: la ruta `/plataforma/nuevo`;
  `crearLaboratorioAction(prev, formData)` con estado `{ error: string }`.

- [ ] **Paso 1: Escribir la prueba del formulario**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormularioLaboratorio } from './FormularioLaboratorio'

const nada = vi.fn(async () => ({ error: '' }))

describe('FormularioLaboratorio', () => {
  it('pide el laboratorio y los datos de su administrador', () => {
    render(<FormularioLaboratorio action={nada} />)
    expect(screen.getByLabelText('Nombre del laboratorio')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del administrador')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo del administrador')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña inicial')).toBeInTheDocument()
  })

  it('usa los nombres de campo que espera la acción', () => {
    render(<FormularioLaboratorio action={nada} />)
    expect(screen.getByLabelText('Nombre del laboratorio')).toHaveAttribute(
      'name',
      'laboratorio',
    )
    expect(screen.getByLabelText('Nombre del administrador')).toHaveAttribute(
      'name',
      'adminNombre',
    )
    expect(screen.getByLabelText('Correo del administrador')).toHaveAttribute(
      'name',
      'adminEmail',
    )
    expect(screen.getByLabelText('Contraseña inicial')).toHaveAttribute(
      'name',
      'adminPassword',
    )
  })

  it('avisa de que el laboratorio arranca sin catálogo', () => {
    render(<FormularioLaboratorio action={nada} />)
    expect(screen.getByText(/sin catálogo/i)).toBeInTheDocument()
  })

  it('muestra el error del servidor', () => {
    render(
      <FormularioLaboratorio
        action={nada}
        errorInicial="Ese correo ya tiene una cuenta en la plataforma"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('ya tiene una cuenta')
  })
})
```

- [ ] **Paso 2: Correrla y ver que falla**

Ejecutar: `pnpm vitest run components/plataforma/FormularioLaboratorio.test.tsx`
Esperado: FALLA con "Failed to resolve import ./FormularioLaboratorio".

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

export function FormularioLaboratorio({ action, errorInicial = '' }: Props) {
  const [state, enviar, pending] = useActionState(action, { error: errorInicial })
  const error = state.error || errorInicial

  return (
    <form action={enviar} className="space-y-3.5">
      <label className="block space-y-1">
        <span className={etiqueta}>Nombre del laboratorio</span>
        <input name="laboratorio" required maxLength={120} className={campo} />
      </label>

      <div className="space-y-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3.5">
        <p className="text-[13px] text-[var(--color-muted)]">
          Su administrador. Con estos datos entrará por primera vez y desde ahí creará
          al resto de su equipo.
        </p>

        <label className="block space-y-1">
          <span className={etiqueta}>Nombre del administrador</span>
          <input name="adminNombre" required maxLength={120} className={campo} />
        </label>

        <label className="block space-y-1">
          <span className={etiqueta}>Correo del administrador</span>
          <input
            name="adminEmail"
            type="email"
            inputMode="email"
            required
            className={campo}
          />
        </label>

        <label className="block space-y-1">
          <span className={etiqueta}>Contraseña inicial</span>
          <input
            name="adminPassword"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            className={campo}
          />
        </label>
      </div>

      <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
        El laboratorio arranca sin catálogo: su administrador registra sus tipos de
        trabajo y precios antes de poder crear el primer trabajo.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-[50px] w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-base font-semibold text-[var(--color-accent-contrast)] disabled:opacity-50"
      >
        {pending ? 'Creando…' : 'Crear laboratorio'}
      </button>
    </form>
  )
}
```

- [ ] **Paso 4: Correrla y ver que pasa**

Ejecutar: `pnpm vitest run components/plataforma/FormularioLaboratorio.test.tsx`
Esperado: PASA, 4 pruebas.

- [ ] **Paso 5: Añadir la acción del alta**

En `app/(plataforma)/plataforma/actions.ts`:

```ts
export interface AltaState {
  error: string
}

export async function crearLaboratorioAction(
  _prev: AltaState,
  formData: FormData,
): Promise<AltaState> {
  await requireSuperAdmin()

  const parsed = laboratorioNuevoSchema.safeParse({
    laboratorio: String(formData.get('laboratorio') ?? ''),
    adminNombre: String(formData.get('adminNombre') ?? ''),
    adminEmail: String(formData.get('adminEmail') ?? ''),
    adminPassword: String(formData.get('adminPassword') ?? ''),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const r = await intentar(
    'crearLaboratorioAction',
    'No se pudo crear el laboratorio',
    () => crearLaboratorioConAdmin(parsed.data),
  )
  if (!r.ok) return r.estado

  revalidatePath('/plataforma')
  // Fuera del envoltorio: `redirect` funciona lanzando una excepción.
  redirect('/plataforma')
}
```

Con los imports que hagan falta: `redirect` de `next/navigation`, `intentar`
de `@/lib/acciones`, y `laboratorioNuevoSchema` y `crearLaboratorioConAdmin`
de `@/lib/plataforma/laboratorios`.

- [ ] **Paso 6: Escribir la pantalla**

```tsx
import Link from 'next/link'
import { FormularioLaboratorio } from '@/components/plataforma/FormularioLaboratorio'
import { crearLaboratorioAction } from '../actions'

export default function NuevoLaboratorioPage() {
  return (
    <section className="space-y-4">
      <Link href="/plataforma" className="inline-block text-[13.5px] text-[var(--color-muted)]">
        ‹ Laboratorios
      </Link>
      <div>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">
          Nuevo laboratorio
        </h1>
        <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
          Se crea el laboratorio y la cuenta de su administrador de una vez.
        </p>
      </div>
      <FormularioLaboratorio action={crearLaboratorioAction} />
    </section>
  )
}
```

- [ ] **Paso 7: Comprobar tipos, suite y compilación**

Ejecutar: `pnpm tsc --noEmit --pretty false 2>&1 | grep -v "inventario/__tests__"`
Esperado: sin errores nuevos.

Ejecutar: `pnpm test`
Esperado: 442 pruebas en verde.

Ejecutar: `pnpm build`
Esperado: "✓ Compiled successfully".

- [ ] **Paso 8: Confirmar**

```bash
git add "app/(plataforma)/plataforma/nuevo" "app/(plataforma)/plataforma/actions.ts" components/plataforma/FormularioLaboratorio.tsx components/plataforma/FormularioLaboratorio.test.tsx
git commit -m "feat(plataforma): alta de laboratorio con su administrador"
```

---

### Tarea 5: Entrada al panel, aislamiento y documentación

**Archivos:**
- Modificar: `components/nav/AppShell.tsx` (calcular la bandera)
- Modificar: `components/nav/Sidebar.tsx` (recibirla y mostrar el enlace)
- Modificar: `.env.example`
- Modificar: `docs/supabase-setup.md`
- Modificar: `scripts/probar-aislamiento.mjs` (comprobación del alta)

**Interfaces:**
- Consume: `esSesionSuperAdmin()` (Tarea 1).
- Produce: `<Sidebar perfil={...} esSuperAdmin={boolean} />`.

- [ ] **Paso 1: Pasar la bandera desde el servidor**

`Sidebar` es un componente de cliente y no puede comprobar el rol por sí mismo;
`AppShell` sí es de servidor. En `AppShell.tsx`, añadir el import y la llamada:

```tsx
import { esSesionSuperAdmin } from '@/lib/plataforma/acceso'
```

y dentro del componente, antes del `return`:

```tsx
  const superAdmin = await esSesionSuperAdmin()
```

pasándolo al `Sidebar`: `<Sidebar perfil={perfil} esSuperAdmin={superAdmin} />`.

- [ ] **Paso 2: Mostrar el enlace en el pie de la barra lateral**

En `Sidebar.tsx`, ampliar las props a
`{ perfil, esSuperAdmin }: { perfil: Perfil; esSuperAdmin?: boolean }` y añadir
en el pie, antes del enlace de Configuración:

```tsx
        {esSuperAdmin ? (
          <Link
            href="/plataforma"
            className="flex h-11 items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-surface-2)]"
          >
            Plataforma
          </Link>
        ) : null}
```

- [ ] **Paso 3: Documentar la variable**

En `.env.example`:

```
# Correos que administran la plataforma, separados por coma. Da acceso a
# /plataforma para dar de alta laboratorios. Si falta, nadie tiene ese acceso.
SUPERADMIN_EMAILS=
```

- [ ] **Paso 4: Añadir la comprobación del alta al aislamiento**

En `scripts/probar-aislamiento.mjs`, al final de las comprobaciones, antes de
la limpieza, verificar que un laboratorio creado por el alta queda igual de
aislado que los sembrados a mano. Reutiliza los ayudantes que ya existen en el
script: crea un laboratorio y su administrador con `crearLaboratorio` y
`crearUsuario`, entra con ese administrador y comprueba que no ve el
laboratorio B.

- [ ] **Paso 5: Reemplazar los pasos manuales de la documentación**

En `docs/supabase-setup.md`, los pasos 3 a 5 (crear el laboratorio, crear el
usuario y vincularlo con SQL) pasan a decir que eso ahora se hace desde
`/plataforma`, y que el SQL a mano queda solo para el primer laboratorio de un
proyecto nuevo, cuando todavía no hay super-administrador con sesión.

- [ ] **Paso 6: Verificación completa**

Ejecutar: `pnpm test`
Esperado: 442 pruebas en verde.

Ejecutar: `pnpm build`
Esperado: "✓ Compiled successfully".

Ejecutar: `CONFIRMO=si pnpm test:aislamiento`
Esperado: **todas las comprobaciones en verde**, incluida la nueva. Este es el
criterio de aceptación de las restricciones globales: el panel no debilitó el
aislamiento.

- [ ] **Paso 7: Prueba manual de punta a punta**

1. Con `SUPERADMIN_EMAILS` puesto, entrar y comprobar que aparece "Plataforma"
   en el pie de la barra lateral.
2. Crear un laboratorio de prueba con su administrador.
3. Salir, entrar con ese administrador y comprobar que solo ve su laboratorio,
   vacío.
4. Volver como super-administrador, suspenderlo, y comprobar que el
   administrador de ese laboratorio ve la pantalla de cuenta suspendida.
5. Reactivarlo y comprobar que vuelve a entrar.
6. Con un usuario que **no** esté en `SUPERADMIN_EMAILS`, visitar `/plataforma`
   y comprobar que va a `/hoy`.
7. Borrar el laboratorio de prueba.

- [ ] **Paso 8: Confirmar**

```bash
git add components/nav/AppShell.tsx components/nav/Sidebar.tsx .env.example docs/supabase-setup.md scripts/probar-aislamiento.mjs
git commit -m "feat(plataforma): entrada al panel, comprobación de aislamiento y documentación"
```

---

## Revisión del plan contra el spec

**Cobertura.** §6.1 identidad del super-administrador → Tarea 1, incluido el
caso de que la ausencia de configuración no concede acceso. §6.2 aislamiento →
restricción global más la Tarea 5, paso 6, como criterio de aceptación. §6.3
pantallas → Tareas 3 y 4; el enlace de entrada, en la Tarea 5. §6.4 alta con
reversión → Tarea 2. §7 manejo de errores → `intentar` en las Tareas 3 y 4, con
el mensaje propio de correo ya registrado en la Tarea 2. §8 pruebas → unitarias
en cada tarea, aislamiento y prueba manual en la Tarea 5.

**Del spec y deliberadamente fuera:** el caso del super-administrador sin
laboratorio queda documentado y sin resolver, como dice §6.1 — el panel se
alcanza por dirección directa y el enlace de la barra lateral solo existe para
quien además tiene perfil.

**Consistencia de nombres.** `esSuperAdmin` / `esSesionSuperAdmin` /
`requireSuperAdmin` (Tarea 1) se usan con esos nombres en las Tareas 3, 4 y 5.
`LaboratorioFila` y `laboratorioNuevoSchema` (Tarea 2) se consumen en las
Tareas 3 y 4. `cambiarEstadoAction` se define en la Tarea 3 paso 5 y la usa
`FilaLaboratorio` del paso 3; `crearLaboratorioAction` se añade al mismo
archivo en la Tarea 4.
