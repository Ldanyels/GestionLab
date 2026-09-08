# Rediseño GestionLab — Fase 1: Fundación visual y navegación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar instalada la base visual del rediseño —paleta, tipografía, primitivos y navegación (barra inferior móvil + barra lateral de escritorio)— de modo que todas las pantallas existentes ya se vean con la nueva identidad y el sistema sea usable en escritorio.

**Architecture:** Se conservan los nombres de variables CSS que el repo ya usa en ~40 archivos y se actualizan sus **valores** a los del rediseño, agregando los tokens que faltan; así ninguna pantalla se rompe mientras se migra. Sobre esa base se crean primitivos compartidos (`Card`, `Chip`, `KpiTile`, `BackRow`, `Sheet`, `Toast`) y un `AppShell` responsive con punto de corte único en 980 px. Las pantallas se rediseñan en fases posteriores consumiendo estos primitivos.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, Tailwind CSS 4, Vitest + @testing-library/react (jsdom), Playwright para capturas de verificación.

**Spec:** `docs/rediseño/README.md` (handoff de alta fidelidad). Prototipo navegable: `docs/rediseño/GestionLab Rediseño.dc.html`.

## Global Constraints

- **Fidelidad:** hi-fi. Colores, tamaños, radios y espaciados de la sección 9 del spec son finales.
- **Sin cambios de funcionalidad.** No se agrega ni se quita ninguna capacidad del sistema; solo cambia la presentación.
- **Punto de corte único: 980 px.** Debajo: header 56 px + barra inferior 62 px con `env(safe-area-inset-bottom)`. Encima: barra lateral fija de 236 px (`position: sticky; height: 100vh`) y sin barra inferior.
- **Ancho máximo del contenido: 880 px**, centrado, `padding: 18px 16px 110px`.
- **Objetivos táctiles:** ningún control interactivo baja de 44 px de alto en móvil. Excepciones del spec: flechas de reordenar (38×24 px) y botones de icono del header (40 px).
- **Nunca `#fff` fijo sobre el acento.** Usar `var(--color-accent-contrast)`, que es blanco en claro y tinta oscura en oscuro.
- **Textos de interfaz en español, tuteo, sin emoji.** Los textos del prototipo son los definitivos.
- **Tipografía:** Geist para interfaz, **Geist Mono para todo importe, cantidad, fecha corta y dato numérico** (clase `.num` ya existente).
- **Colores de consultorio** (iguales en ambos temas): `#db2777`, `#0891b2`, `#2563eb`, `#7c3aed`, `#d97706`, `#dc2626`, `#ca8a04`. Ya implementados en `lib/consultorios/color.ts`; no tocar.
- **`text-wrap: pretty`** global y `balance` en títulos de tarjeta. Ninguna caja de texto con alto fijo ni `nowrap`, salvo chips y precios.

### Decisiones tomadas sobre el spec

| Punto del spec | Decisión |
|---|---|
| 5.1 Hoy: dirección A o B | **Dirección A** (agenda del día). El conmutador A/B del prototipo no va a producción. |
| 5.1 Hoy: chips "Hoy"/"Mañana" | **Solo hoy.** La agenda lista únicamente entregas con fecha de hoy; se descarta el chip "Mañana" y los ítems de mañana. Decisión del usuario del 8/9/2026, posterior al handoff. |
| 9 Nombres de tokens | Se conservan los del repo (`--color-*`) con los **valores** del spec. Tabla de equivalencias en la Tarea 1. |
| 6.6 Clave de `localStorage` del tema | Se conserva `theme` (ya en uso) en lugar de `gl-theme`, para no descartar la preferencia guardada de los usuarios actuales. |
| 7 `screen` en `localStorage` | No aplica: en producción la pantalla activa la resuelve el App Router. |
| 5.2 Login: columna derecha de presentación | **Se omite.** El spec la marca opcional y la app es de uso interno. |
| 11 Marca Skardiam | Pendiente. Esta fase no la aborda; queda aislada en `--color-accent` y derivados. |
| 4.1 Cinco destinos de navegación | Son los del administrador. Se conserva `Reportes` como destino condicional del técnico con permiso: es su única vía de acceso (ver Tarea 6). |

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `app/globals.css` | **Modificar.** Paleta completa (claro/oscuro), sombras, radios, `text-wrap`. Única fuente de color. |
| `lib/__tests__/tokens.test.ts` | **Crear.** Regresión: verifica que existan los tokens y valores exigidos por el spec. |
| `components/ui/Card.tsx` | **Crear.** Tarjeta de sección y de lista, con borde izquierdo de color opcional. |
| `components/ui/Chip.tsx` | **Crear.** Chip de estado/etiqueta con tono semántico. |
| `components/ui/KpiTile.tsx` | **Crear.** Tarjeta de cifra (etiqueta + valor en mono). |
| `components/ui/BackRow.tsx` | **Crear.** Fila de retorno: botón cuadrado de 40 px + título. |
| `components/ui/Sheet.tsx` | **Crear.** Hoja inferior con overlay y animación de entrada. |
| `components/ui/ConfirmDialog.tsx` | **Modificar.** Pasa a usar `Sheet` y los textos exactos del spec 6.2. |
| `components/ui/Toast.tsx` | **Crear.** Proveedor de avisos con autocierre a 2200 ms. |
| `components/nav/AppShell.tsx` | **Crear.** Header móvil, barra lateral de escritorio y contenedor de contenido. |
| `components/nav/BottomNav.tsx` | **Modificar.** Solo la barra inferior; se oculta en ≥980 px. |
| `components/nav/Sidebar.tsx` | **Crear.** Barra lateral de 236 px con los 5 destinos + Configuración, Tema y Salir. |
| `app/(app)/layout.tsx` | **Modificar.** Reemplaza el header y el contenedor actuales por `AppShell`. |

---

### Task 1: Paleta y tokens de diseño

**Files:**
- Modify: `app/globals.css`
- Test: `lib/__tests__/tokens.test.ts` (crear)

**Interfaces:**
- Consumes: nada.
- Produces: variables CSS que consumen todas las tareas siguientes:
  `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-text`, `--color-muted`,
  `--color-border`, `--color-accent`, `--color-accent-soft`, `--color-accent-ink`,
  `--color-accent-contrast`, `--color-accent-glow`, `--color-danger`, `--color-danger-soft`,
  `--color-success`, `--color-success-soft`, `--color-warn`, `--color-warn-soft`,
  `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (16px), `--radius-xl` (20px),
  `--shadow-card`, `--shadow-pop`.

Equivalencias con el spec (sección 9):

| Spec | Repo |
|---|---|
| `--bg` | `--color-bg` |
| `--surface` | `--color-surface` |
| `--surface2` | `--color-surface-2` *(nuevo)* |
| `--text` | `--color-text` |
| `--muted` | `--color-muted` |
| `--border` | `--color-border` |
| `--accent` | `--color-accent` |
| `--accentSoft` | `--color-accent-soft` |
| `--accentInk` | `--color-accent-ink` *(nuevo)* |
| `--accentOn` | `--color-accent-contrast` |
| `--accentGlow` | `--color-accent-glow` *(nuevo)* |
| `--danger` / `--dangerSoft` | `--color-danger` / `--color-danger-soft` *(nuevo)* |
| `--success` / `--successSoft` | `--color-success` / `--color-success-soft` *(nuevo)* |
| `--warn` / `--warnSoft` | `--color-warn` *(nuevo)* / `--color-warn-soft` *(nuevo)* |
| `--shadow` / `--pop` | `--shadow-card` / `--shadow-pop` |

- [ ] **Step 1: Escribir el test que falla**

Crear `lib/__tests__/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

/** Bloque de declaraciones que sigue a un selector, para aislar cada tema. */
function bloque(selector: string): string {
  const i = css.indexOf(selector)
  if (i === -1) return ''
  const abre = css.indexOf('{', i)
  return css.slice(abre, css.indexOf('}', abre))
}

const CLARO: Record<string, string> = {
  '--color-bg': '#F6F7F9',
  '--color-surface': '#FFFFFF',
  '--color-surface-2': '#FBFCFD',
  '--color-text': '#14181F',
  '--color-muted': '#626B7A',
  '--color-border': '#E5E8EE',
  '--color-accent': '#2F6FED',
  '--color-accent-soft': '#EAF1FE',
  '--color-accent-ink': '#1B4FBF',
  '--color-accent-contrast': '#FFFFFF',
  '--color-danger': '#DC2A2A',
  '--color-danger-soft': '#FDECEC',
  '--color-success': '#12855F',
  '--color-success-soft': '#E7F6EF',
  '--color-warn': '#B45309',
  '--color-warn-soft': '#FEF3E2',
}

const OSCURO: Record<string, string> = {
  '--color-bg': '#0F1216',
  '--color-surface': '#171B21',
  '--color-surface-2': '#1D222A',
  '--color-text': '#F2F4F7',
  '--color-muted': '#9AA4B2',
  '--color-border': '#2A303A',
  '--color-accent': '#7EA6FF',
  '--color-accent-soft': '#1D2942',
  '--color-accent-ink': '#BBD0FF',
  '--color-accent-contrast': '#0E141C',
  '--color-danger': '#FF7A7A',
  '--color-danger-soft': '#3A2020',
  '--color-success': '#4ED8A5',
  '--color-success-soft': '#12301F',
  '--color-warn': '#F5B461',
  '--color-warn-soft': '#332413',
}

describe('paleta del rediseño', () => {
  it('define el tema claro en :root con los valores del spec', () => {
    const raiz = bloque(':root {')
    for (const [token, valor] of Object.entries(CLARO)) {
      expect(raiz, `${token} en tema claro`).toContain(`${token}: ${valor}`)
    }
  })

  it('define el tema oscuro con los valores del spec', () => {
    const oscuro = bloque(":root[data-theme='dark']")
    for (const [token, valor] of Object.entries(OSCURO)) {
      expect(oscuro, `${token} en tema oscuro`).toContain(`${token}: ${valor}`)
    }
  })

  it('el oscuro por sistema usa la misma paleta', () => {
    const porSistema = bloque(":root:not([data-theme='light'])")
    expect(porSistema).toContain('--color-bg: #0F1216')
    expect(porSistema).toContain('--color-accent: #7EA6FF')
  })

  it('define los radios y sombras del spec', () => {
    expect(css).toContain('--radius-sm: 0.5rem')
    expect(css).toContain('--radius-md: 0.75rem')
    expect(css).toContain('--radius-lg: 1rem')
    expect(css).toContain('--radius-xl: 1.25rem')
    expect(css).toContain('--shadow-card:')
    expect(css).toContain('--shadow-pop:')
    expect(css).toContain('--color-accent-glow:')
  })

  it('expone los tokens nuevos como utilidades de Tailwind', () => {
    const tema = bloque('@theme inline')
    for (const token of [
      '--color-surface-2',
      '--color-danger-soft',
      '--color-success-soft',
      '--color-warn',
      '--color-warn-soft',
    ]) {
      expect(tema, `${token} en @theme`).toContain(token)
    }
  })

  it('activa text-wrap: pretty de forma global', () => {
    expect(css).toMatch(/text-wrap:\s*pretty/)
  })
})
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `pnpm vitest run lib/__tests__/tokens.test.ts`
Expected: FAIL — los valores actuales están en `oklch(...)`, no en los hex del spec.

- [ ] **Step 3: Reescribir la paleta en `app/globals.css`**

Sustituir los bloques `:root`, `@media (prefers-color-scheme: dark)`, `:root[data-theme='dark']` y `@theme inline` por:

```css
@import "tailwindcss";

/* ── Tokens de diseño — rediseño 2026 ─────────────────────────
   Fuente única de color. Ningún componente lleva color fijo,
   salvo los de consultorio (lib/consultorios/color.ts). */
:root {
  --color-bg: #F6F7F9;
  --color-surface: #FFFFFF;
  --color-surface-2: #FBFCFD;
  --color-text: #14181F;
  --color-muted: #626B7A;
  --color-border: #E5E8EE;

  --color-accent: #2F6FED;
  --color-accent-soft: #EAF1FE;
  --color-accent-ink: #1B4FBF;
  --color-accent-contrast: #FFFFFF;
  --color-accent-glow: rgba(47, 111, 237, 0.28);

  --color-danger: #DC2A2A;
  --color-danger-soft: #FDECEC;
  --color-success: #12855F;
  --color-success-soft: #E7F6EF;
  --color-warn: #B45309;
  --color-warn-soft: #FEF3E2;

  --radius-sm: 0.5rem;   /* 8px  — píldora pequeña */
  --radius-md: 0.75rem;  /* 12px — botones e inputs */
  --radius-lg: 1rem;     /* 16px — tarjeta de sección */
  --radius-xl: 1.25rem;  /* 20px — tarjeta destacada y hoja */
  --space-touch: 2.75rem;

  --shadow-card: 0 1px 2px rgba(20, 24, 31, 0.05), 0 1px 3px rgba(20, 24, 31, 0.05);
  --shadow-pop: 0 14px 40px rgba(20, 24, 31, 0.18);
}

/* Paleta oscura: compartida por "sistema en oscuro" y por elección manual. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-bg: #0F1216;
    --color-surface: #171B21;
    --color-surface-2: #1D222A;
    --color-text: #F2F4F7;
    --color-muted: #9AA4B2;
    --color-border: #2A303A;

    --color-accent: #7EA6FF;
    --color-accent-soft: #1D2942;
    --color-accent-ink: #BBD0FF;
    --color-accent-contrast: #0E141C;
    --color-accent-glow: rgba(126, 166, 255, 0.22);

    --color-danger: #FF7A7A;
    --color-danger-soft: #3A2020;
    --color-success: #4ED8A5;
    --color-success-soft: #12301F;
    --color-warn: #F5B461;
    --color-warn-soft: #332413;

    --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.45);
    --shadow-pop: 0 14px 40px rgba(0, 0, 0, 0.55);
  }
}

:root[data-theme='dark'] {
  --color-bg: #0F1216;
  --color-surface: #171B21;
  --color-surface-2: #1D222A;
  --color-text: #F2F4F7;
  --color-muted: #9AA4B2;
  --color-border: #2A303A;

  --color-accent: #7EA6FF;
  --color-accent-soft: #1D2942;
  --color-accent-ink: #BBD0FF;
  --color-accent-contrast: #0E141C;
  --color-accent-glow: rgba(126, 166, 255, 0.22);

  --color-danger: #FF7A7A;
  --color-danger-soft: #3A2020;
  --color-success: #4ED8A5;
  --color-success-soft: #12301F;
  --color-warn: #F5B461;
  --color-warn-soft: #332413;

  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.45);
  --shadow-pop: 0 14px 40px rgba(0, 0, 0, 0.55);
}

@theme inline {
  --color-bg: var(--color-bg);
  --color-surface: var(--color-surface);
  --color-surface-2: var(--color-surface-2);
  --color-text: var(--color-text);
  --color-muted: var(--color-muted);
  --color-border: var(--color-border);
  --color-accent: var(--color-accent);
  --color-accent-soft: var(--color-accent-soft);
  --color-accent-ink: var(--color-accent-ink);
  --color-danger: var(--color-danger);
  --color-danger-soft: var(--color-danger-soft);
  --color-success: var(--color-success);
  --color-success-soft: var(--color-success-soft);
  --color-warn: var(--color-warn);
  --color-warn-soft: var(--color-warn-soft);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans), system-ui, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  text-wrap: pretty;
}

/* Números como lectura de instrumento (dinero, stock, KPIs) */
.num {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* Títulos: apretados y con quiebre equilibrado */
h1,
h2,
h3 {
  text-wrap: balance;
  letter-spacing: -0.02em;
}

/* Foco accesible y consistente en toda la app */
:where(a, button, input, select, textarea):focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `pnpm vitest run lib/__tests__/tokens.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Verificar que no se rompió ninguna pantalla**

Run: `pnpm vitest run && pnpm build`
Expected: los 123 tests previos siguen en verde y la build compila. Los componentes que
usaban `--color-accent-soft` y compañía siguen funcionando porque los nombres no cambiaron.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css lib/__tests__/tokens.test.ts
git commit -m "feat(diseno): paleta y tokens del rediseno"
```

---

### Task 2: Primitivos `Card` y `Chip`

**Files:**
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Chip.tsx`
- Test: `components/ui/Card.test.tsx`, `components/ui/Chip.test.tsx`

**Interfaces:**
- Consumes: tokens de la Tarea 1.
- Produces:
  - `Card({ children, tono?, colorLateral?, className?, as? })` — `tono: 'seccion' | 'lista' | 'destacada'` (radios 16 / 14 / 20), `colorLateral?: string` pinta el borde izquierdo de 4 px.
  - `Chip({ children, tono, conPunto? })` — `tono: 'neutro' | 'acento' | 'exito' | 'peligro' | 'aviso'`.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `components/ui/Card.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renderiza su contenido', () => {
    render(<Card>Contenido</Card>)
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('usa radio 16 en tono sección y 14 en tono lista', () => {
    const { container: seccion } = render(<Card tono="seccion">a</Card>)
    const { container: lista } = render(<Card tono="lista">b</Card>)
    expect(seccion.firstElementChild?.className).toContain('rounded-[var(--radius-lg)]')
    expect(lista.firstElementChild?.className).toContain('rounded-[14px]')
  })

  it('pinta el borde izquierdo con el color del consultorio', () => {
    const { container } = render(<Card colorLateral="#db2777">a</Card>)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.borderLeftColor).toBe('rgb(219, 39, 119)')
    expect(el.className).toContain('border-l-4')
  })

  it('sin colorLateral no agrega borde de color', () => {
    const { container } = render(<Card>a</Card>)
    expect((container.firstElementChild as HTMLElement).className).not.toContain('border-l-4')
  })
})
```

Crear `components/ui/Chip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Chip } from './Chip'

describe('Chip', () => {
  it('muestra su texto', () => {
    render(<Chip tono="acento">En curso</Chip>)
    expect(screen.getByText('En curso')).toBeInTheDocument()
  })

  it('aplica el par de colores del tono', () => {
    const { container } = render(<Chip tono="peligro">Vencido</Chip>)
    const cls = (container.firstElementChild as HTMLElement).className
    expect(cls).toContain('bg-[var(--color-danger-soft)]')
    expect(cls).toContain('text-[var(--color-danger)]')
  })

  it('no permite que el texto se quiebre', () => {
    const { container } = render(<Chip tono="neutro">Pendiente</Chip>)
    expect((container.firstElementChild as HTMLElement).className).toContain('whitespace-nowrap')
  })

  it('con conPunto agrega el punto de 6 px', () => {
    const { container } = render(
      <Chip tono="exito" conPunto>
        Entregado
      </Chip>,
    )
    expect(container.querySelector('[aria-hidden]')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `pnpm vitest run components/ui/Card.test.tsx components/ui/Chip.test.tsx`
Expected: FAIL — "Failed to resolve import ./Card".

- [ ] **Step 3: Implementar los primitivos**

Crear `components/ui/Card.tsx`:

```tsx
import type { ReactNode } from 'react'

type Tono = 'seccion' | 'lista' | 'destacada'

const RADIO: Record<Tono, string> = {
  seccion: 'rounded-[var(--radius-lg)]',
  lista: 'rounded-[14px]',
  destacada: 'rounded-[var(--radius-xl)]',
}

interface Props {
  children: ReactNode
  tono?: Tono
  /** Color del consultorio: pinta el borde izquierdo de 4 px. */
  colorLateral?: string
  className?: string
}

export function Card({ children, tono = 'seccion', colorLateral, className = '' }: Props) {
  return (
    <div
      style={colorLateral ? { borderLeftColor: colorLateral } : undefined}
      className={`border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ${RADIO[tono]} ${colorLateral ? 'border-l-4' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
```

Crear `components/ui/Chip.tsx`:

```tsx
import type { ReactNode } from 'react'

type Tono = 'neutro' | 'acento' | 'exito' | 'peligro' | 'aviso'

const TONOS: Record<Tono, string> = {
  neutro: 'bg-[var(--color-surface-2)] text-[var(--color-muted)]',
  acento: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  exito: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  peligro: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  aviso: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
}

interface Props {
  children: ReactNode
  tono: Tono
  /** Punto de 6 px antes del texto (chips de estado). */
  conPunto?: boolean
}

export function Chip({ children, tono, conPunto }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-bold ${TONOS[tono]}`}
    >
      {conPunto ? (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `pnpm vitest run components/ui/Card.test.tsx components/ui/Chip.test.tsx`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add components/ui/Card.tsx components/ui/Chip.tsx components/ui/Card.test.tsx components/ui/Chip.test.tsx
git commit -m "feat(ui): primitivos Card y Chip"
```

---

### Task 3: Primitivos `KpiTile` y `BackRow`

**Files:**
- Create: `components/ui/KpiTile.tsx`
- Create: `components/ui/BackRow.tsx`
- Test: `components/ui/KpiTile.test.tsx`, `components/ui/BackRow.test.tsx`

**Interfaces:**
- Consumes: `Card` de la Tarea 2.
- Produces:
  - `KpiTile({ etiqueta, valor, tono? })` — `tono: 'normal' | 'peligro' | 'exito' | 'acento' | 'aviso'`; valor en `.num` a 26 px/700.
  - `BackRow({ href, titulo, migaDePan? })` — botón cuadrado de 40 px con chevron + `h1` de 24 px.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `components/ui/KpiTile.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiTile } from './KpiTile'

describe('KpiTile', () => {
  it('muestra etiqueta y valor', () => {
    render(<KpiTile etiqueta="Entregas de hoy" valor="7" />)
    expect(screen.getByText('Entregas de hoy')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('el valor usa la tipografía mono', () => {
    render(<KpiTile etiqueta="Por cobrar" valor="S/ 3,300.00" />)
    expect(screen.getByText('S/ 3,300.00').className).toContain('num')
  })

  it('el tono peligro pinta el valor en rojo', () => {
    render(<KpiTile etiqueta="Por cobrar" valor="S/ 10.00" tono="peligro" />)
    expect(screen.getByText('S/ 10.00').className).toContain('text-[var(--color-danger)]')
  })
})
```

Crear `components/ui/BackRow.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BackRow } from './BackRow'

describe('BackRow', () => {
  it('muestra el título como encabezado', () => {
    render(<BackRow href="/trabajos" titulo="Nuevo trabajo" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nuevo trabajo')
  })

  it('el retorno es un enlace accesible al destino', () => {
    render(<BackRow href="/trabajos" titulo="Nuevo trabajo" />)
    const enlace = screen.getByRole('link', { name: /volver/i })
    expect(enlace).toHaveAttribute('href', '/trabajos')
  })

  it('muestra la miga de pan cuando se indica', () => {
    render(<BackRow href="/configuracion" titulo="Catálogo" migaDePan="Configuración" />)
    expect(screen.getByText('Configuración')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `pnpm vitest run components/ui/KpiTile.test.tsx components/ui/BackRow.test.tsx`
Expected: FAIL — imports sin resolver.

- [ ] **Step 3: Implementar los primitivos**

Crear `components/ui/KpiTile.tsx`:

```tsx
import { Card } from './Card'

type Tono = 'normal' | 'peligro' | 'exito' | 'acento' | 'aviso'

const COLOR: Record<Tono, string> = {
  normal: 'text-[var(--color-text)]',
  peligro: 'text-[var(--color-danger)]',
  exito: 'text-[var(--color-success)]',
  acento: 'text-[var(--color-accent)]',
  aviso: 'text-[var(--color-warn)]',
}

interface Props {
  etiqueta: string
  valor: string
  tono?: Tono
}

export function KpiTile({ etiqueta, valor, tono = 'normal' }: Props) {
  return (
    <Card className="px-4 py-3.5">
      <p className="text-[12.5px] font-semibold text-[var(--color-muted)]">{etiqueta}</p>
      <p className={`num mt-0.5 text-[26px] font-bold leading-tight ${COLOR[tono]}`}>
        {valor}
      </p>
    </Card>
  )
}
```

Crear `components/ui/BackRow.tsx`:

```tsx
import Link from 'next/link'

interface Props {
  href: string
  titulo: string
  /** Texto de contexto sobre el título (ej. "Configuración"). */
  migaDePan?: string
}

export function BackRow({ href, titulo, migaDePan }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={href}
        aria-label="Volver"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <div className="min-w-0">
        {migaDePan ? (
          <p className="text-[13.5px] text-[var(--color-muted)]">{migaDePan}</p>
        ) : null}
        <h1 className="truncate text-2xl font-bold">{titulo}</h1>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `pnpm vitest run components/ui/KpiTile.test.tsx components/ui/BackRow.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add components/ui/KpiTile.tsx components/ui/BackRow.tsx components/ui/KpiTile.test.tsx components/ui/BackRow.test.tsx
git commit -m "feat(ui): primitivos KpiTile y BackRow"
```

---

### Task 4: Hoja inferior `Sheet` y confirmaciones destructivas

**Files:**
- Create: `components/ui/Sheet.tsx`
- Modify: `components/ui/ConfirmDialog.tsx`
- Test: `components/ui/Sheet.test.tsx`, `components/ui/ConfirmDialog.test.tsx`

**Interfaces:**
- Consumes: tokens de la Tarea 1.
- Produces: `Sheet({ abierta, onCerrar, titulo, children, anchoMax? })` — overlay `rgba(10,13,18,.5)`,
  panel anclado abajo, radio superior 22, cierre por clic en el overlay, por botón y con `Escape`.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `components/ui/Sheet.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from './Sheet'

describe('Sheet', () => {
  it('no renderiza nada cuando está cerrada', () => {
    render(
      <Sheet abierta={false} onCerrar={() => {}} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('abierta muestra título y contenido en un diálogo modal', () => {
    render(
      <Sheet abierta onCerrar={() => {}} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    const dialogo = screen.getByRole('dialog')
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Tipo de trabajo')).toBeInTheDocument()
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('cierra con el botón de cierre', async () => {
    const onCerrar = vi.fn()
    render(
      <Sheet abierta onCerrar={onCerrar} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(onCerrar).toHaveBeenCalledOnce()
  })

  it('cierra con la tecla Escape', async () => {
    const onCerrar = vi.fn()
    render(
      <Sheet abierta onCerrar={onCerrar} titulo="Tipo de trabajo">
        contenido
      </Sheet>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onCerrar).toHaveBeenCalledOnce()
  })
})
```

Crear `components/ui/ConfirmDialog.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

const props = {
  action: async () => {},
  fields: { id: 'abc' },
  triggerLabel: 'Eliminar',
  title: 'Eliminar trabajo',
  message: 'Se borra el trabajo, sus etapas y sus abonos. No se puede deshacer.',
  confirmLabel: 'Sí, eliminar',
}

describe('ConfirmDialog', () => {
  it('empieza cerrado y se abre al tocar el disparador', async () => {
    render(<ConfirmDialog {...props} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(props.message)).toBeInTheDocument()
  })

  it('envía los campos ocultos que recibe la acción', async () => {
    render(<ConfirmDialog {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    const oculto = document.querySelector('input[name=id]') as HTMLInputElement
    expect(oculto.value).toBe('abc')
  })

  it('el botón destructivo usa el rótulo indicado', async () => {
    render(<ConfirmDialog {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('button', { name: 'Sí, eliminar' })).toBeInTheDocument()
  })

  it('se puede cancelar', async () => {
    render(<ConfirmDialog {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `pnpm vitest run components/ui/Sheet.test.tsx components/ui/ConfirmDialog.test.tsx`
Expected: FAIL — `Sheet` no existe; los tests de `ConfirmDialog` fallan al no encontrar el rol `dialog` con el marcado nuevo.

Si `@testing-library/user-event` no está instalado: `pnpm add -D @testing-library/user-event`.

- [ ] **Step 3: Implementar `Sheet`**

Crear `components/ui/Sheet.tsx`:

```tsx
'use client'

import { useEffect, type ReactNode } from 'react'

interface Props {
  abierta: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
  /** Ancho máximo del panel. 560 px para selección, 420 px para confirmar. */
  anchoMax?: number
}

export function Sheet({ abierta, onCerrar, titulo, children, anchoMax = 560 }: Props) {
  useEffect(() => {
    if (!abierta) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierta, onCerrar])

  if (!abierta) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onCerrar}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(10,13,18,0.5)] sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: anchoMax }}
        className="flex max-h-[82vh] w-full flex-col rounded-t-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-pop)] motion-safe:animate-[sheetIn_220ms_ease-out] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-muted)]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
```

Añadir la animación al final de `app/globals.css`:

```css
@keyframes sheetIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 4: Reescribir `ConfirmDialog` sobre `Sheet`**

Reemplazar el contenido de `components/ui/ConfirmDialog.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Sheet } from './Sheet'

interface Props {
  /** Server Action a ejecutar al confirmar. */
  action: (formData: FormData) => void | Promise<void>
  /** Campos ocultos que recibe la acción (ej. id). */
  fields: Record<string, string>
  triggerLabel: string
  triggerClassName?: string
  title: string
  message: string
  confirmLabel?: string
}

export function ConfirmDialog({
  action,
  fields,
  triggerLabel,
  triggerClassName = '',
  title,
  message,
  confirmLabel = 'Eliminar',
}: Props) {
  const [abierta, setAbierta] = useState(false)

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setAbierta(true)}>
        {triggerLabel}
      </button>

      <Sheet
        abierta={abierta}
        onCerrar={() => setAbierta(false)}
        titulo={title}
        anchoMax={420}
      >
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">{message}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setAbierta(false)}
            className="h-11 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium"
          >
            Cancelar
          </button>
          <form action={action} className="flex-1">
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <button
              type="submit"
              className="h-11 w-full rounded-[var(--radius-md)] bg-[var(--color-danger)] text-sm font-medium text-white"
            >
              {confirmLabel}
            </button>
          </form>
        </div>
      </Sheet>
    </>
  )
}
```

- [ ] **Step 5: Ejecutar y verificar que pasan**

Run: `pnpm vitest run components/ui/Sheet.test.tsx components/ui/ConfirmDialog.test.tsx`
Expected: PASS (8 tests)

- [ ] **Step 6: Ajustar los textos de confirmación del spec 6.2**

Los tres textos exactos, en sus llamadas actuales:

| Archivo | `title` | `message` | `confirmLabel` |
|---|---|---|---|
| `app/(app)/trabajos/[id]/page.tsx` | `Eliminar trabajo` | `Se borra el trabajo, sus etapas y sus abonos. No se puede deshacer.` | `Sí, eliminar` |
| `app/(app)/consultorios/[id]/page.tsx` | `Eliminar definitivo` | `Se borra {nombre}, sus doctores y su historial. ¿Prefieres archivar?` | `Sí, eliminar` |
| `app/(app)/inventario/[id]/page.tsx` | `Eliminar definitivo` | `Esto borra «{nombre}» y todo su historial de movimientos. No se puede deshacer.` | `Sí, eliminar` |

- [ ] **Step 7: Verificación completa y commit**

Run: `pnpm vitest run && pnpm build`
Expected: todo en verde.

```bash
git add components/ui/Sheet.tsx components/ui/Sheet.test.tsx components/ui/ConfirmDialog.tsx components/ui/ConfirmDialog.test.tsx app/globals.css "app/(app)"
git commit -m "feat(ui): hoja inferior Sheet y confirmaciones del rediseno"
```

---

### Task 5: Avisos (`Toast`)

**Files:**
- Create: `components/ui/Toast.tsx`
- Modify: `app/(app)/layout.tsx` (montar el proveedor)
- Test: `components/ui/Toast.test.tsx`

**Interfaces:**
- Consumes: tokens de la Tarea 1.
- Produces:
  - `ToastProvider({ children })` — monta la región de avisos.
  - `useToast(): (mensaje: string) => void` — muestra un aviso con autocierre a 2200 ms.

- [ ] **Step 1: Escribir el test que falla**

Crear `components/ui/Toast.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

function Disparador() {
  const avisar = useToast()
  return (
    <button type="button" onClick={() => avisar('Orden actualizado')}>
      avisar
    </button>
  )
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('no muestra nada al inicio', () => {
    render(
      <ToastProvider>
        <Disparador />
      </ToastProvider>,
    )
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('muestra el mensaje al avisar', async () => {
    render(
      <ToastProvider>
        <Disparador />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'avisar' }))
    expect(screen.getByRole('status')).toHaveTextContent('Orden actualizado')
  })

  it('se cierra solo a los 2200 ms', async () => {
    render(
      <ToastProvider>
        <Disparador />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'avisar' }))
    act(() => {
      vi.advanceTimersByTime(2199)
    })
    expect(screen.queryByRole('status')).not.toBeNull()
    act(() => {
      vi.advanceTimersByTime(2)
    })
    expect(screen.queryByRole('status')).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `pnpm vitest run components/ui/Toast.test.tsx`
Expected: FAIL — import sin resolver.

- [ ] **Step 3: Implementar el proveedor**

Crear `components/ui/Toast.tsx`:

```tsx
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
```

Añadir la animación al final de `app/globals.css`:

```css
@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `pnpm vitest run components/ui/Toast.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/ui/Toast.tsx components/ui/Toast.test.tsx app/globals.css
git commit -m "feat(ui): avisos con autocierre"
```

---

### Task 6: Barra lateral de escritorio (`Sidebar`)

**Files:**
- Create: `components/nav/Sidebar.tsx`
- Modify: `components/nav/BottomNav.tsx` (extraer la lista de destinos)
- Create: `components/nav/destinos.ts`
- Test: `components/nav/destinos.test.ts` (renombra y reemplaza `BottomNav.test.tsx`)

**Interfaces:**
- Consumes: `puede()` de `lib/permisos`, `Perfil` de `lib/supabase/types`.
- Produces:
  - `destinos.ts`: `NavItem { label, href, roles, permiso? }`, `NAV_PRINCIPAL: NavItem[]`, `navItemsFor(perfil): NavItem[]`.
  - `Sidebar({ perfil })` — barra de 236 px, oculta bajo 980 px.

- [ ] **Step 1: Mover la lógica de destinos y escribir su test**

Crear `components/nav/destinos.ts` con el contenido actual de `ALL_ITEMS` y `navItemsFor`
de `components/nav/BottomNav.tsx` (sin cambios de comportamiento), y mover
`components/nav/BottomNav.test.tsx` a `components/nav/destinos.test.ts` ajustando el import
a `./destinos`.

- [ ] **Step 2: Ejecutar y verificar que pasa**

Run: `pnpm vitest run components/nav/destinos.test.ts`
Expected: PASS (4 tests, los mismos de antes)

- [ ] **Step 3: Escribir el test de la barra lateral**

Añadir a `components/nav/destinos.test.ts`:

```ts
import { NAV_PRINCIPAL } from './destinos'

describe('NAV_PRINCIPAL', () => {
  it('tiene los cinco destinos del rediseño en orden', () => {
    expect(NAV_PRINCIPAL.map((i) => i.label)).toEqual([
      'Hoy',
      'Consultorios',
      'Trabajos',
      'Inventario',
      'Finanzas',
    ])
  })

  it('Configuración no está en la navegación principal', () => {
    expect(NAV_PRINCIPAL.map((i) => i.href)).not.toContain('/configuracion')
  })
})
```

**Corrección sobre el spec (4.1):** el spec describe 5 destinos, que son los del
administrador. `Reportes` **se conserva** como destino condicional del técnico con permiso
`reportes`: sin él no tendría ninguna vía de acceso, porque Finanzas y Estado de cuenta son
solo de administrador, y el spec exige no quitar funcionalidad. Un técnico ve como máximo
Hoy · Consultorios · Trabajos · Inventario · Reportes, nunca más de cinco.

```ts
describe('acceso a Reportes', () => {
  it('el técnico con permiso conserva su destino de Reportes', () => {
    const labels = navItemsFor(perfil({ permisos: ['reportes'] })).map((i) => i.label)
    expect(labels).toContain('Reportes')
    expect(labels.length).toBeLessThanOrEqual(5)
  })
})
```

- [ ] **Step 4: Ejecutar, ver fallar, implementar**

Run: `pnpm vitest run components/nav/destinos.test.ts`
Expected: FAIL — `NAV_PRINCIPAL` no exportado / incluye Reportes.

Crear `components/nav/Sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItemsFor } from './destinos'
import { ICONOS, LogoDiente } from './icons'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Perfil } from '@/lib/supabase/types'

export function Sidebar({ perfil }: { perfil: Perfil }) {
  const pathname = usePathname()
  const activo = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 min-[980px]:flex">
      <span className="flex items-center gap-2 px-2 py-1 text-lg font-bold tracking-tight">
        <LogoDiente className="text-[var(--color-accent)]" width={22} height={22} />
        GestionLab
      </span>

      <nav aria-label="Navegación principal" className="mt-6 flex flex-col gap-1">
        {navItemsFor(perfil).map((item) => {
          const Icono = ICONOS[item.href as keyof typeof ICONOS]
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo(item.href) ? 'page' : undefined}
              className={`flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors ${
                activo(item.href)
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {Icono ? <Icono /> : null}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
        {perfil.rol === 'admin' ? (
          <Link
            href="/configuracion"
            className="flex h-11 items-center rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            Configuración
          </Link>
        ) : null}
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-sm text-[var(--color-muted)]">Tema</span>
          <ThemeToggle />
        </div>
        <a
          href="/login/logout"
          className="flex h-11 items-center rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-muted)] hover:text-[var(--color-danger)]"
        >
          Salir
        </a>
      </div>
    </aside>
  )
}
```

En `components/nav/BottomNav.tsx`: eliminar `ALL_ITEMS`/`navItemsFor` (ahora en `destinos.ts`),
importar `navItemsFor` desde `./destinos`, y añadir `min-[980px]:hidden` a la clase del `<nav>`.

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `pnpm vitest run components/nav/`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/nav/
git commit -m "feat(nav): barra lateral de escritorio y destinos compartidos"
```

---

### Task 7: `AppShell` responsive

**Files:**
- Create: `components/nav/AppShell.tsx`
- Modify: `app/(app)/layout.tsx`
- Test: `components/nav/AppShell.test.tsx`

**Interfaces:**
- Consumes: `Sidebar`, `BottomNav`, `ToastProvider`, `ThemeToggle`.
- Produces: `AppShell({ perfil, children })` — header móvil de 56 px (logo, Tema, Configuración, Salir),
  barra lateral en ≥980 px, contenido con `max-width: 880px` y `padding: 18px 16px 110px`.

- [ ] **Step 1: Escribir el test que falla**

Crear `components/nav/AppShell.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'
import type { Perfil } from '@/lib/supabase/types'

const admin: Perfil = {
  id: '1',
  laboratorio_id: 'l',
  nombre: 'Ana',
  rol: 'admin',
  permisos: [],
}

describe('AppShell', () => {
  it('renderiza el contenido dentro de un main', () => {
    render(
      <AppShell perfil={admin}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.getByRole('main')).toHaveTextContent('contenido')
  })

  it('el contenido no supera 880 px', () => {
    render(
      <AppShell perfil={admin}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.getByRole('main').className).toContain('max-w-[880px]')
  })

  it('el header móvil ofrece Configuración al administrador', () => {
    render(
      <AppShell perfil={admin}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.getByRole('link', { name: /configuración/i })).toBeInTheDocument()
  })

  it('el técnico no ve Configuración', () => {
    render(
      <AppShell perfil={{ ...admin, rol: 'tecnico' }}>
        <p>contenido</p>
      </AppShell>,
    )
    expect(screen.queryByRole('link', { name: /configuración/i })).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `pnpm vitest run components/nav/AppShell.test.tsx`
Expected: FAIL — import sin resolver.

- [ ] **Step 3: Implementar el shell**

Crear `components/nav/AppShell.tsx`:

```tsx
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { LogoDiente } from './icons'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ToastProvider } from '@/components/ui/Toast'
import type { Perfil } from '@/lib/supabase/types'

export function AppShell({
  perfil,
  children,
}: {
  perfil: Perfil
  children: ReactNode
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <Sidebar perfil={perfil} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header solo en móvil: en escritorio manda la barra lateral. */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 px-4 backdrop-blur min-[980px]:hidden">
            <span className="flex items-center gap-2 font-bold tracking-tight">
              <LogoDiente className="text-[var(--color-accent)]" width={20} height={20} />
              GestionLab
            </span>
            <nav className="flex items-center gap-1 text-sm">
              <ThemeToggle />
              {perfil.rol === 'admin' ? (
                <Link
                  href="/configuracion"
                  aria-label="Configuración"
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)]"
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
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

        <BottomNav perfil={perfil} />
      </div>
    </ToastProvider>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `pnpm vitest run components/nav/AppShell.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Enchufar el shell en el layout**

En `app/(app)/layout.tsx`, sustituir el `<div className="min-h-dvh pb-16">…</div>` final
(header + `<main>` + `<BottomNav>`) por:

```tsx
return <AppShell perfil={perfil}>{children}</AppShell>
```

Conservar intactos el `redirect('/login')` sin sesión y la pantalla de "No pudimos leer tu
perfil" / "Cuenta sin laboratorio". Eliminar los imports que queden sin uso
(`Link`, `BottomNav`, `LogoDiente`, `ThemeToggle`) y añadir el de `AppShell`.

- [ ] **Step 6: Verificación completa**

Run: `pnpm vitest run && pnpm lint && pnpm build`
Expected: tests en verde, sin errores nuevos de lint, build compila.

- [ ] **Step 7: Verificación visual**

Con el servidor en marcha (`npx next dev -p 3111`):

```bash
CAP_EMAIL=<correo> CAP_PASS=<clave> CAP_OUT=docs/capturas/fase-1 \
CAP_ID_TRABAJO=<uuid> CAP_ID_CONSULTORIO=<uuid> CAP_ID_DOCTOR=<uuid> \
CAP_ID_CATALOGO=<uuid> CAP_ID_TRABAJADOR=<uuid> \
node scripts/capturar-pantallas.mjs

CAP_ANCHO=1280 CAP_EMAIL=<correo> CAP_PASS=<clave> CAP_OUT=docs/capturas/fase-1-escritorio \
node scripts/capturar-pantallas.mjs
```

Comprobar en las imágenes: la paleta nueva en todas las pantallas, la barra lateral en la
tanda de 1280 px (sin barra inferior), y que ninguna pantalla desborde en horizontal.

- [ ] **Step 8: Commit**

```bash
git add components/nav/AppShell.tsx components/nav/AppShell.test.tsx "app/(app)/layout.tsx" docs/capturas/
git commit -m "feat(nav): shell responsive con barra lateral en escritorio"
```

---

## Self-Review de este plan

**Cobertura del spec en esta fase:** sección 9 completa (tokens) → Tarea 1; 6.1/6.2 (hojas y
confirmaciones) → Tarea 4; 6.3 (avisos) → Tarea 5; 4.1 y 6.5 (navegación y responsive) →
Tareas 6-7; 6.6 (tema) → conservado y montado en header y barra lateral; 6.7 (objetivos
táctiles) → alturas fijadas en cada primitivo.

**Fuera de esta fase, con plan propio:** las pantallas. Quedan tres planes por escribir,
cada uno entregando software funcionando:

| Plan | Alcance | Secciones del spec |
|---|---|---|
| Fase 2 — Núcleo operativo | Hoy (dirección A, solo hoy), Trabajos lista, Nuevo/Editar trabajo con hoja de tipos, Detalle de trabajo, Recibo | 5.1, 5.3, 5.4, 5.5, 5.6 |
| Fase 3 — Clientes y cobranza | Consultorios (4 pantallas), Doctor, Estado de cuenta, Reportes, Ticket, Login | 5.2, 5.7–5.11, 5.17, 5.18 |
| Fase 4 — Inventario, finanzas y configuración | Inventario (5), Finanzas con gráficos, Configuración, Catálogo, Trabajadores, Usuarios, Auditoría | 5.12–5.16, 5.19–5.25 |

Se escriben al terminar la fase anterior, para que cada plan se apoye en primitivos que ya
existen y no en supuestos.
