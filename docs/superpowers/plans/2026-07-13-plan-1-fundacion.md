# GestionLab — Plan 1: Fundación Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levantar el esqueleto de GestionLab: app Next.js (PWA) con Supabase, aislamiento multi-inquilino por RLS, autenticación con roles (Admin/Técnico) y sistema de diseño base, dejando un login funcional y un shell de app navegable.

**Architecture:** App única Next.js (App Router, TypeScript) desplegable en Vercel. Los datos y la autenticación viven en Supabase (PostgreSQL). Cada tabla de negocio lleva `laboratorio_id` y Row Level Security la restringe al laboratorio del usuario autenticado. El acceso por rol se resuelve en una tabla `perfil` ligada a `auth.users`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Supabase (Postgres + Auth + supabase-js), Vitest + React Testing Library (unit), Playwright (E2E), ESLint + Prettier.

## Global Constraints

- Idioma de la UI: **Español**. Moneda: **Soles (S/)**.
- **Mobile-first**: objetivos táctiles ≥ 44px, acción primaria alcanzable con el pulgar.
- **Multi-inquilino desde el día 1**: toda tabla de negocio incluye `laboratorio_id uuid not null` y política RLS por laboratorio.
- **Sin secretos hardcodeados**: claves solo vía variables de entorno (`.env.local`, nunca commiteadas).
- Roles: `admin` (acceso total) y `tecnico` (sin finanzas ni inventario).
- Archivos enfocados (< 300 líneas típico), patrones inmutables, manejo explícito de errores.
- Node.js ≥ 20. Gestor de paquetes: **pnpm**.
- Nombres de tablas/columnas en **snake_case**; tipos/componentes en **PascalCase**; variables/funciones en **camelCase**.

---

### Task 1: Scaffold del proyecto y control de versiones

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.env.example`, `README.md`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: nada (tarea inicial).
- Produces: proyecto Next.js arrancable con `pnpm dev`; repositorio git inicializado.

- [ ] **Step 1: Inicializar git y crear el proyecto Next.js**

Run (desde la raíz `GestionLab/`):
```bash
git init
pnpm create next-app@latest . --typescript --app --tailwind --eslint --src-dir=false --import-alias "@/*" --use-pnpm --no-turbopack
```
Cuando pregunte por sobrescribir archivos existentes (docs/), responde **No** para conservar `docs/`.

- [ ] **Step 2: Crear `.gitignore` y `.env.example`**

`.gitignore` (asegurar que contiene):
```
node_modules/
.next/
.env*.local
.env
*.log
.DS_Store
coverage/
playwright-report/
test-results/
```

`.env.example`:
```
# Supabase — obtener de https://app.supabase.com > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 3: Verificar que arranca**

Run: `pnpm dev`
Expected: servidor en `http://localhost:3000` sin errores. Detener con Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

### Task 2: Herramientas de test (Vitest + RTL + Playwright)

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`
- Modify: `package.json` (scripts)
- Create: `lib/__tests__/smoke.test.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: proyecto de Task 1.
- Produces: comandos `pnpm test` (unit) y `pnpm e2e` (Playwright) funcionando.

- [ ] **Step 1: Instalar dependencias de test**

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 2: Crear `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
})
```

`vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Crear `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: { command: 'pnpm dev', url: 'http://localhost:3000', reuseExistingServer: true },
})
```

- [ ] **Step 4: Añadir scripts a `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test"
}
```

- [ ] **Step 5: Escribir el test de humo (unit) — debe fallar primero**

`lib/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { appName } from '@/lib/config'

describe('config', () => {
  it('expone el nombre de la app', () => {
    expect(appName).toBe('GestionLab')
  })
})
```

Run: `pnpm test`
Expected: FAIL — `@/lib/config` no existe.

- [ ] **Step 6: Crear `lib/config.ts` para que pase**

```ts
export const appName = 'GestionLab'
export const currency = 'PEN'
export const currencySymbol = 'S/'
```

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 7: E2E de humo**

`e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('la home responde', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})
```

Run: `pnpm e2e`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: add Vitest and Playwright harness with smoke tests"
```

---

### Task 3: Sistema de diseño base (tokens + utilidades UI)

**Files:**
- Modify: `app/globals.css` (design tokens)
- Create: `lib/format.ts`, `lib/__tests__/format.test.ts`
- Create: `components/ui/Button.tsx`, `components/ui/Button.test.tsx`

**Interfaces:**
- Consumes: Tailwind de Task 1.
- Produces:
  - `formatMoney(value: number): string` → `"S/ 90.00"`.
  - `<Button variant="primary"|"ghost"|"danger" size="md"|"lg">`.
  - Tokens CSS: `--color-bg`, `--color-surface`, `--color-text`, `--color-accent`, radios y espaciado.

- [ ] **Step 1: Definir design tokens en `app/globals.css`**

Reemplazar el `:root` con tokens minimalistas (soporta claro/oscuro):
```css
@import "tailwindcss";

:root {
  --color-bg: oklch(98.5% 0 0);
  --color-surface: oklch(100% 0 0);
  --color-text: oklch(20% 0.01 250);
  --color-muted: oklch(55% 0.01 250);
  --color-border: oklch(90% 0.005 250);
  --color-accent: oklch(58% 0.15 245);
  --color-danger: oklch(58% 0.20 25);
  --radius-md: 0.75rem;
  --space-touch: 2.75rem; /* 44px objetivo táctil */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: oklch(18% 0.01 250);
    --color-surface: oklch(23% 0.01 250);
    --color-text: oklch(96% 0 0);
    --color-muted: oklch(70% 0.01 250);
    --color-border: oklch(32% 0.01 250);
  }
}

body { background: var(--color-bg); color: var(--color-text); }
```

- [ ] **Step 2: Test de `formatMoney` — debe fallar**

`lib/__tests__/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatMoney } from '@/lib/format'

describe('formatMoney', () => {
  it('formatea soles con dos decimales', () => {
    expect(formatMoney(90)).toBe('S/ 90.00')
    expect(formatMoney(1234.5)).toBe('S/ 1,234.50')
  })
})
```

Run: `pnpm test format`
Expected: FAIL.

- [ ] **Step 3: Implementar `lib/format.ts`**

```ts
export function formatMoney(value: number): string {
  return `S/ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
```

Run: `pnpm test format`
Expected: PASS.

- [ ] **Step 4: Test del `Button` — debe fallar**

`components/ui/Button.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza el texto y aplica variante primaria', () => {
    render(<Button variant="primary">Guardar</Button>)
    const btn = screen.getByRole('button', { name: 'Guardar' })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('bg-[var(--color-accent)]')
  })
})
```

Run: `pnpm test Button`
Expected: FAIL.

- [ ] **Step 5: Implementar `components/ui/Button.tsx`**

```tsx
import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--color-accent)] text-white',
  ghost: 'bg-transparent text-[var(--color-text)] border border-[var(--color-border)]',
  danger: 'bg-[var(--color-danger)] text-white',
}
const sizes: Record<Size, string> = {
  md: 'h-11 px-4 text-sm',
  lg: 'h-14 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition active:scale-[0.98] disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
```

Run: `pnpm test Button`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add design tokens, money formatter and Button component"
```

---

### Task 4: Esquema Supabase multi-inquilino con RLS

**Files:**
- Create: `supabase/migrations/0001_fundacion.sql`
- Create: `docs/supabase-setup.md`

**Interfaces:**
- Consumes: nada de la app (SQL puro sobre Supabase).
- Produces: tablas `laboratorio`, `perfil`; función `laboratorio_actual()`; políticas RLS reutilizables por otras tablas.

- [ ] **Step 1: Documentar el setup manual de Supabase**

`docs/supabase-setup.md`:
```md
# Setup de Supabase
1. Crear proyecto en https://app.supabase.com.
2. Copiar URL y anon key a `.env.local` (ver `.env.example`).
3. Ejecutar las migraciones de `supabase/migrations/` en el SQL Editor, en orden.
4. Crear el primer laboratorio (MasterLab) y el usuario admin (Task 6).
```

- [ ] **Step 2: Escribir la migración `0001_fundacion.sql`**

```sql
-- Extensiones
create extension if not exists "pgcrypto";

-- Tabla de inquilinos (laboratorios)
create table laboratorio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  plan text not null default 'gratis' check (plan in ('gratis','pagado')),
  estado text not null default 'activo' check (estado in ('activo','suspendido')),
  creado_en timestamptz not null default now()
);

-- Perfil de usuario, ligado a auth.users, con laboratorio y rol
create table perfil (
  id uuid primary key references auth.users(id) on delete cascade,
  laboratorio_id uuid not null references laboratorio(id) on delete restrict,
  nombre text not null,
  rol text not null default 'tecnico' check (rol in ('admin','tecnico')),
  creado_en timestamptz not null default now()
);

-- Laboratorio del usuario autenticado (usada por todas las políticas RLS)
create or replace function laboratorio_actual()
returns uuid
language sql stable security definer set search_path = public
as $$ select laboratorio_id from perfil where id = auth.uid() $$;

-- RLS
alter table laboratorio enable row level security;
alter table perfil enable row level security;

create policy laboratorio_propio on laboratorio
  for select using (id = laboratorio_actual());

create policy perfil_propio_lab on perfil
  for select using (laboratorio_id = laboratorio_actual());

create policy perfil_self_insert on perfil
  for insert with check (id = auth.uid());
```

- [ ] **Step 3: Ejecutar la migración en Supabase**

Pegar el SQL en Supabase SQL Editor y ejecutar.
Expected: tablas `laboratorio` y `perfil` creadas; sin errores. Verificar en Table Editor.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(db): add multi-tenant schema with RLS (laboratorio, perfil)"
```

---

### Task 5: Cliente Supabase (browser + server)

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/types.ts`
- Create: `lib/supabase/__tests__/env.test.ts`

**Interfaces:**
- Consumes: variables de entorno de Task 1.
- Produces:
  - `createBrowserSupabase(): SupabaseClient` (componentes cliente).
  - `createServerSupabase(): Promise<SupabaseClient>` (Server Components / actions, lee cookies).
  - Tipos `Rol = 'admin' | 'tecnico'`, `Perfil`, `Laboratorio`.

- [ ] **Step 1: Instalar dependencias**

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Definir tipos en `lib/supabase/types.ts`**

```ts
export type Rol = 'admin' | 'tecnico'

export interface Laboratorio {
  id: string
  nombre: string
  plan: 'gratis' | 'pagado'
  estado: 'activo' | 'suspendido'
}

export interface Perfil {
  id: string
  laboratorio_id: string
  nombre: string
  rol: Rol
}
```

- [ ] **Step 3: Test de validación de entorno — debe fallar**

`lib/supabase/__tests__/env.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { readSupabaseEnv } from '@/lib/supabase/client'

describe('readSupabaseEnv', () => {
  it('lanza error claro si falta la URL', () => {
    expect(() => readSupabaseEnv({ url: '', anonKey: 'x' })).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })
  it('devuelve las claves cuando existen', () => {
    expect(readSupabaseEnv({ url: 'u', anonKey: 'k' })).toEqual({ url: 'u', anonKey: 'k' })
  })
})
```

Run: `pnpm test env`
Expected: FAIL.

- [ ] **Step 4: Implementar `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr'

export function readSupabaseEnv(input: { url?: string; anonKey?: string }) {
  const url = input.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = input.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) throw new Error('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return { url, anonKey }
}

export function createBrowserSupabase() {
  const { url, anonKey } = readSupabaseEnv({})
  return createBrowserClient(url, anonKey)
}
```

Run: `pnpm test env`
Expected: PASS.

- [ ] **Step 5: Implementar `lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { readSupabaseEnv } from './client'

export async function createServerSupabase() {
  const { url, anonKey } = readSupabaseEnv({})
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          /* Server Component: ignora escritura de cookies */
        }
      },
    },
  })
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Supabase browser and server clients with env validation"
```

---

### Task 6: Autenticación (login) y sesión

**Files:**
- Create: `middleware.ts`
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/login/actions.ts`
- Create: `lib/auth.ts`, `lib/__tests__/auth.test.ts`
- Create: `e2e/login.spec.ts`

**Interfaces:**
- Consumes: `createServerSupabase` (Task 5), `Perfil`/`Rol` (Task 5).
- Produces:
  - `getSessionPerfil(): Promise<Perfil | null>`.
  - `requireRol(perfil: Perfil | null, roles: Rol[]): boolean`.
  - Middleware que redirige a `/login` si no hay sesión.

- [ ] **Step 1: Test de `requireRol` — debe fallar**

`lib/__tests__/auth.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { requireRol } from '@/lib/auth'

const admin = { id: '1', laboratorio_id: 'l', nombre: 'A', rol: 'admin' as const }
const tec = { ...admin, rol: 'tecnico' as const }

describe('requireRol', () => {
  it('permite al admin en rutas de admin', () => {
    expect(requireRol(admin, ['admin'])).toBe(true)
  })
  it('rechaza al técnico en rutas de admin', () => {
    expect(requireRol(tec, ['admin'])).toBe(false)
  })
  it('rechaza si no hay perfil', () => {
    expect(requireRol(null, ['admin', 'tecnico'])).toBe(false)
  })
})
```

Run: `pnpm test auth`
Expected: FAIL.

- [ ] **Step 2: Implementar `lib/auth.ts`**

```ts
import { createServerSupabase } from '@/lib/supabase/server'
import type { Perfil, Rol } from '@/lib/supabase/types'

export function requireRol(perfil: Perfil | null, roles: Rol[]): boolean {
  return perfil !== null && roles.includes(perfil.rol)
}

export async function getSessionPerfil(): Promise<Perfil | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('perfil')
    .select('id, laboratorio_id, nombre, rol')
    .eq('id', user.id)
    .single()
  return (data as Perfil) ?? null
}
```

Run: `pnpm test auth`
Expected: PASS.

- [ ] **Step 3: Middleware de sesión**

`middleware.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons).*)'],
}
```

- [ ] **Step 4: Server Action de login**

`app/(auth)/login/actions.ts`:
```ts
'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Ingresa correo y contraseña' }
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Credenciales inválidas' }
  redirect('/hoy')
}
```

- [ ] **Step 5: Página de login (mobile-first)**

`app/(auth)/login/page.tsx`:
```tsx
'use client'
import { useActionState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { error: '' })
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">GestionLab</h1>
        <input name="email" type="email" placeholder="Correo" required
          className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 bg-[var(--color-surface)]" />
        <input name="password" type="password" placeholder="Contraseña" required
          className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 bg-[var(--color-surface)]" />
        {state?.error ? <p className="text-[var(--color-danger)] text-sm">{state.error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </main>
  )
}
```

- [ ] **Step 6: E2E — el login pide credenciales**

`e2e/login.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('redirige a login sin sesión', async ({ page }) => {
  await page.goto('/hoy')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'GestionLab' })).toBeVisible()
})
```

Run: `pnpm e2e login`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add auth (login, session, role guard, middleware)"
```

---

### Task 7: Shell de la app (layout con navegación por rol)

**Files:**
- Create: `app/(app)/layout.tsx`, `app/(app)/hoy/page.tsx`
- Create: `components/nav/BottomNav.tsx`, `components/nav/BottomNav.test.tsx`
- Create: `app/(auth)/login/logout/route.ts`

**Interfaces:**
- Consumes: `getSessionPerfil`, `requireRol` (Task 6), `Perfil`/`Rol` (Task 5).
- Produces: layout autenticado con navegación inferior; `navItemsFor(rol: Rol): NavItem[]`.

- [ ] **Step 1: Test de `navItemsFor` — debe fallar**

`components/nav/BottomNav.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { navItemsFor } from './BottomNav'

describe('navItemsFor', () => {
  it('el técnico no ve Finanzas ni Inventario', () => {
    const labels = navItemsFor('tecnico').map((i) => i.label)
    expect(labels).toContain('Hoy')
    expect(labels).toContain('Trabajos')
    expect(labels).not.toContain('Finanzas')
    expect(labels).not.toContain('Inventario')
  })
  it('el admin ve todo', () => {
    const labels = navItemsFor('admin').map((i) => i.label)
    expect(labels).toEqual(expect.arrayContaining(['Hoy', 'Trabajos', 'Inventario', 'Finanzas']))
  })
})
```

Run: `pnpm test BottomNav`
Expected: FAIL.

- [ ] **Step 2: Implementar `components/nav/BottomNav.tsx`**

```tsx
import Link from 'next/link'
import type { Rol } from '@/lib/supabase/types'

export interface NavItem { label: string; href: string; roles: Rol[] }

const ALL_ITEMS: NavItem[] = [
  { label: 'Hoy', href: '/hoy', roles: ['admin', 'tecnico'] },
  { label: 'Trabajos', href: '/trabajos', roles: ['admin', 'tecnico'] },
  { label: 'Inventario', href: '/inventario', roles: ['admin'] },
  { label: 'Finanzas', href: '/finanzas', roles: ['admin'] },
]

export function navItemsFor(rol: Rol): NavItem[] {
  return ALL_ITEMS.filter((i) => i.roles.includes(rol))
}

export function BottomNav({ rol }: { rol: Rol }) {
  return (
    <nav aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex">
      {navItemsFor(rol).map((item) => (
        <Link key={item.href} href={item.href}
          className="flex-1 h-14 flex items-center justify-center text-sm">
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

Run: `pnpm test BottomNav`
Expected: PASS.

- [ ] **Step 3: Layout autenticado**

`app/(app)/layout.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { getSessionPerfil } from '@/lib/auth'
import { BottomNav } from '@/components/nav/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getSessionPerfil()
  if (!perfil) redirect('/login')
  return (
    <div className="min-h-dvh pb-16">
      <main className="mx-auto max-w-2xl p-4">{children}</main>
      <BottomNav rol={perfil.rol} />
    </div>
  )
}
```

- [ ] **Step 4: Página "Hoy" (placeholder navegable)**

`app/(app)/hoy/page.tsx`:
```tsx
import { getSessionPerfil } from '@/lib/auth'

export default async function HoyPage() {
  const perfil = await getSessionPerfil()
  return (
    <section>
      <h1 className="text-xl font-semibold">Hoy</h1>
      <p className="text-[var(--color-muted)]">Hola, {perfil?.nombre}. Aquí verás los trabajos del día.</p>
    </section>
  )
}
```

- [ ] **Step 5: Ruta de logout**

`app/(auth)/login/logout/route.ts`:
```ts
import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url))
}
```

- [ ] **Step 6: Verificar build y tests**

Run: `pnpm test && pnpm build`
Expected: unit tests PASS; build sin errores.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add authenticated app shell with role-based bottom nav"
```

---

### Task 8: PWA (manifest + metadatos)

**Files:**
- Create: `app/manifest.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Modify: `app/layout.tsx` (metadatos + viewport)

**Interfaces:**
- Consumes: nada.
- Produces: app instalable como PWA en móvil.

- [ ] **Step 1: Crear `app/manifest.ts`**

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GestionLab',
    short_name: 'GestionLab',
    start_url: '/hoy',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2f6fed',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

- [ ] **Step 2: Añadir iconos**

Colocar `icon-192.png` (192×192) e `icon-512.png` (512×512) en `public/icons/`. Placeholder simple con fondo `#2f6fed` y la letra "G" hasta tener el logo definitivo.

- [ ] **Step 3: Configurar metadatos y viewport en `app/layout.tsx`**

Asegurar en `app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'GestionLab',
  description: 'Gestión para laboratorios dentales',
  manifest: '/manifest.webmanifest',
}
export const viewport: Viewport = {
  themeColor: '#2f6fed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
```

- [ ] **Step 4: Verificar el manifest**

Run: `pnpm dev`, abrir `http://localhost:3000/manifest.webmanifest`
Expected: JSON del manifest servido correctamente.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest, icons and viewport metadata"
```

---

## Self-Review

**Cobertura del spec (Plan 1):**
- Stack Next.js + Supabase → Tasks 1, 5. ✅
- Multi-inquilino + RLS → Task 4. ✅
- Auth + roles (admin/tecnico) → Tasks 6, 7. ✅
- Sistema de diseño / dirección visual → Task 3, 7, 8. ✅
- PWA mobile-first → Tasks 7, 8. ✅
- Español / Soles → Task 2 (`config.ts`), Task 3 (`formatMoney`). ✅
- Módulos de negocio (consultorios, catálogo, trabajos, abonos, inventario, pagos, BI) → **fuera de alcance de Plan 1**; cubiertos por Planes 2–8 (rutas placeholder ya enlazadas en la nav).

**Placeholders:** las páginas `Hoy`/`Trabajos`/`Inventario`/`Finanzas` son intencionalmente mínimas; cada una se implementa en su plan. No hay TODOs sin código en pasos de código.

**Consistencia de tipos:** `Rol`, `Perfil`, `Laboratorio` definidos en Task 5 y usados con la misma forma en Tasks 6–7. `laboratorio_actual()` (SQL) es la base de RLS que reutilizarán los Planes 2–8.

---

## Handoff a los siguientes planes

Cada plan posterior asume estas convenciones establecidas aquí:
- Toda tabla nueva: `laboratorio_id uuid not null references laboratorio(id)` + política RLS
  `using (laboratorio_id = laboratorio_actual())`.
- Componentes UI reutilizan tokens de `app/globals.css` y `components/ui/`.
- Server Components leen datos con `createServerSupabase`; mutaciones vía Server Actions.
- TDD: test primero (Vitest para lógica, Playwright para flujos), commits frecuentes.
