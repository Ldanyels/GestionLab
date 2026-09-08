# Rediseño GestionLab — Fase 2: Núcleo operativo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar las cinco pantallas que el laboratorio usa a diario —Hoy, lista de Trabajos, alta/edición de trabajo, ficha del trabajo y recibo— sobre los primitivos de la fase 1.

**Architecture:** Las pantallas siguen siendo Server Components que leen por `lib/` y delegan la interacción a Client Components acotados. El filtrado y el conteo de la lista de trabajos pasan a memoria mediante funciones puras testeables (el volumen es de decenas a cientos de trabajos por laboratorio). La selección de tipo de trabajo pasa de combobox a hoja inferior reutilizando `Sheet` y `filtrarTipos`, ya existentes y probados.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Vitest + @testing-library/react, Playwright para verificación visual.

**Spec:** `docs/rediseño/README.md`, secciones 5.1, 5.3, 5.4, 5.5, 5.6 y 6.1. Fase previa: `docs/superpowers/plans/2026-09-08-rediseno-fase-1-fundacion.md`.

## Global Constraints

Se heredan todas las de la fase 1 (paleta, 980 px de corte, 880 px de ancho, 44 px táctiles, `--color-accent-contrast` sobre el acento, español con tuteo sin emoji, Geist Mono para cifras). Además:

- **Hoy = Dirección A, estrictamente solo hoy.** Sin chip "Mañana" ni entregas de otros días.
- **Los importes solo los ve quien tiene permiso.** En Hoy, el KPI "Por cobrar" y el bloque "A quién cobrar" son de administrador (`veMontos`); un técnico ve la pantalla sin ellos.
- **Primitivos antes que marcado nuevo.** Usar `Card`, `Chip`, `KpiTile`, `BackRow`, `Sheet` y `useToast` de la fase 1; no reintroducir marcado equivalente.
- **`text-wrap: balance` solo con `.titulo-balance`** y únicamente donde el título tenga ancho propio (lección de la fase 1).

### Decisión de rendimiento

`listTrabajos()` deja de filtrar por estado y por texto en la base: la lista se trae completa
y se filtra en memoria con funciones puras. Es lo que permite mostrar el conteo en cada
pastilla y buscar por paciente, doctor, consultorio y tipo a la vez. Es adecuado hasta unos
pocos miles de trabajos por laboratorio; si algún día se pasa de ahí, hay que volver a
filtrar en la base y calcular los conteos con `count` por estado.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `lib/trabajos/filtro.ts` | **Crear.** `filtrarTrabajos(lista, q)` y `contarPorEstado(lista)`, puras. |
| `lib/trabajos/data.ts` | **Modificar.** `listTrabajos` sin filtro de texto/estado en la base. |
| `lib/hoy/data.ts` | **Crear.** Datos de la pantalla Hoy: entregas del día, KPIs y top de deuda. |
| `app/(app)/hoy/page.tsx` | **Modificar.** Dirección A completa. |
| `app/(app)/trabajos/page.tsx` | **Modificar.** Buscador ampliado, pastillas con conteo, tarjeta de tres filas. |
| `components/trabajos/TrabajoCard.tsx` | **Crear.** Tarjeta de trabajo de la lista (spec 5.3). |
| `components/trabajos/TipoSheet.tsx` | **Crear.** Hoja de selección de tipo (spec 6.1); reemplaza `TipoCombobox`. |
| `components/trabajos/TipoCombobox.tsx` | **Eliminar.** Sustituido por `TipoSheet`. |
| `components/trabajos/TrabajoForm.tsx` | **Modificar.** Líneas con la hoja, barra de total pegada al fondo. |
| `app/(app)/trabajos/[id]/page.tsx` | **Modificar.** Cabecera, acciones en fila propia, costeo, etapas. |
| `components/trabajos/PagosSection.tsx` | **Modificar.** Tres cifras, lista de abonos y alta (spec 5.5). |
| `components/trabajos/ReciboTicket.tsx` | **Modificar.** Rótulos y tipografía del spec 5.6. |

---

### Task 1: Filtro y conteo de trabajos (funciones puras)

**Files:**
- Create: `lib/trabajos/filtro.ts`
- Modify: `lib/trabajos/data.ts`
- Test: `lib/trabajos/filtro.test.ts`

**Interfaces:**
- Produces:
  - `filtrarTrabajos<T extends CamposBuscables>(lista, q): T[]` — busca en tipo, paciente, doctor y consultorio; ignora tildes y mayúsculas; exige todas las palabras.
  - `contarPorEstado(lista): { todos: number; en_curso: number; cerrado: number; entregado: number }`.

- [ ] **Step 1: Escribir el test que falla** (`lib/trabajos/filtro.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { filtrarTrabajos, contarPorEstado } from './filtro'

const lista = [
  { tipo_nombre: 'Corona porcelana', paciente_nombre: 'Juan Díaz', doctor_nombre: 'Dr. Pérez', consultorio_nombre: 'Arte oral', estado: 'en_curso' as const },
  { tipo_nombre: 'Férula', paciente_nombre: null, doctor_nombre: 'Dra. Meza', consultorio_nombre: 'Claudia Meza', estado: 'cerrado' as const },
  { tipo_nombre: 'Reparación', paciente_nombre: 'Ana', doctor_nombre: 'Dr. Pérez', consultorio_nombre: 'Arte oral', estado: 'entregado' as const },
]

describe('filtrarTrabajos', () => {
  it('sin búsqueda devuelve todo', () => {
    expect(filtrarTrabajos(lista, '')).toHaveLength(3)
  })

  it('busca por tipo de trabajo', () => {
    expect(filtrarTrabajos(lista, 'corona')).toHaveLength(1)
  })

  it('busca por paciente ignorando tildes', () => {
    expect(filtrarTrabajos(lista, 'diaz')).toHaveLength(1)
  })

  it('busca por doctor y por consultorio', () => {
    expect(filtrarTrabajos(lista, 'perez')).toHaveLength(2)
    expect(filtrarTrabajos(lista, 'arte oral')).toHaveLength(2)
  })

  it('exige todas las palabras', () => {
    expect(filtrarTrabajos(lista, 'corona juan')).toHaveLength(1)
    expect(filtrarTrabajos(lista, 'corona ana')).toHaveLength(0)
  })

  it('tolera pacientes sin nombre', () => {
    expect(filtrarTrabajos(lista, 'ferula')).toHaveLength(1)
  })
})

describe('contarPorEstado', () => {
  it('cuenta el total y cada estado', () => {
    expect(contarPorEstado(lista)).toEqual({
      todos: 3,
      en_curso: 1,
      cerrado: 1,
      entregado: 1,
    })
  })

  it('lista vacía cuenta cero', () => {
    expect(contarPorEstado([])).toEqual({ todos: 0, en_curso: 0, cerrado: 0, entregado: 0 })
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `pnpm vitest run lib/trabajos/filtro.test.ts` → FAIL (import sin resolver).

- [ ] **Step 3: Implementar `lib/trabajos/filtro.ts`**

```ts
import type { EstadoTrabajo } from './estado'

export interface CamposBuscables {
  tipo_nombre: string
  paciente_nombre: string | null
  doctor_nombre: string
  consultorio_nombre: string
}

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Busca en tipo, paciente, doctor y consultorio. Todas las palabras deben coincidir. */
export function filtrarTrabajos<T extends CamposBuscables>(
  lista: readonly T[],
  q: string,
): T[] {
  const tokens = normalizar(q.trim()).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return [...lista]
  return lista.filter((t) => {
    const texto = normalizar(
      `${t.tipo_nombre} ${t.paciente_nombre ?? ''} ${t.doctor_nombre} ${t.consultorio_nombre}`,
    )
    return tokens.every((tok) => texto.includes(tok))
  })
}

export interface ConteoEstados {
  todos: number
  en_curso: number
  cerrado: number
  entregado: number
}

/** Conteo por estado para las pastillas de filtro. */
export function contarPorEstado(
  lista: readonly { estado: EstadoTrabajo }[],
): ConteoEstados {
  const conteo: ConteoEstados = { todos: lista.length, en_curso: 0, cerrado: 0, entregado: 0 }
  for (const t of lista) conteo[t.estado] += 1
  return conteo
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa** → PASS (8 tests)

- [ ] **Step 5: Quitar el filtro de texto de la base**

En `lib/trabajos/data.ts`, en `listTrabajos`, eliminar la línea
`if (opts?.q?.trim()) query = query.ilike('paciente_nombre', ...)` y el campo `q` de
`opts`. Mantener `estado` y `doctorId` (los usa `/doctores/[id]`).

- [ ] **Step 6: Ejecutar toda la suite y commit**

Run: `pnpm vitest run && pnpm build`

```bash
git add lib/trabajos/
git commit -m "feat(trabajos): filtro y conteo en memoria"
```

---

### Task 2: Datos de la pantalla Hoy

**Files:**
- Create: `lib/hoy/data.ts`
- Test: `lib/hoy/resumen.test.ts`

**Interfaces:**
- Produces:
  - `resumenHoy(trabajos, hoy): { entregasHoy: number; enCurso: number; porCobrar: number }` — puro.
  - `topDeuda(grupos, n): { id: string; nombre: string; detalle: string; saldo: number }[]` — puro.
  - `datosHoy(perfil): Promise<DatosHoy>` — orquesta las consultas; incluye deuda solo si `veMontos`.

- [ ] **Step 1: Escribir el test que falla** (`lib/hoy/resumen.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { resumenHoy, topDeuda } from './data'

const trabajos = [
  { estado: 'en_curso' as const, fecha_entrega: '2026-09-08', saldo: 100 },
  { estado: 'en_curso' as const, fecha_entrega: '2026-09-09', saldo: 50 },
  { estado: 'cerrado' as const, fecha_entrega: '2026-09-08', saldo: 0 },
  { estado: 'entregado' as const, fecha_entrega: null, saldo: 25 },
]

describe('resumenHoy', () => {
  it('cuenta las entregas del día sin importar el estado', () => {
    expect(resumenHoy(trabajos, '2026-09-08').entregasHoy).toBe(2)
  })

  it('cuenta solo los trabajos en curso', () => {
    expect(resumenHoy(trabajos, '2026-09-08').enCurso).toBe(2)
  })

  it('suma la deuda de todos los trabajos', () => {
    expect(resumenHoy(trabajos, '2026-09-08').porCobrar).toBe(175)
  })

  it('sin trabajos todo es cero', () => {
    expect(resumenHoy([], '2026-09-08')).toEqual({ entregasHoy: 0, enCurso: 0, porCobrar: 0 })
  })
})

describe('topDeuda', () => {
  const grupos = [
    { consultorio_id: 'c1', consultorio: 'Arte oral', saldo: 750, doctores: [{ doctor: 'Ivan', filas: [1, 2, 3, 4, 5] }] },
    { consultorio_id: 'c2', consultorio: 'Jean', saldo: 470, doctores: [{ doctor: 'Jean', filas: [1, 2, 3] }] },
    { consultorio_id: 'c3', consultorio: 'Sin deuda', saldo: 0, doctores: [{ doctor: 'X', filas: [1] }] },
  ]

  it('devuelve los que más deben, en orden', () => {
    const top = topDeuda(grupos, 2)
    expect(top.map((t) => t.nombre)).toEqual(['Arte oral', 'Jean'])
  })

  it('descarta a los que no deben', () => {
    expect(topDeuda(grupos, 5)).toHaveLength(2)
  })

  it('describe doctores y cantidad de trabajos', () => {
    expect(topDeuda(grupos, 1)[0].detalle).toBe('Ivan · 5 trabajos')
  })

  it('un solo trabajo va en singular', () => {
    const uno = [{ consultorio_id: 'c', consultorio: 'A', saldo: 10, doctores: [{ doctor: 'D', filas: [1] }] }]
    expect(topDeuda(uno, 1)[0].detalle).toBe('D · 1 trabajo')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla** → FAIL

- [ ] **Step 3: Implementar `lib/hoy/data.ts`**

```ts
import { listTrabajos } from '@/lib/trabajos/data'
import { filasReporte } from '@/lib/reportes/data'
import { agruparPorConsultorio, soloConSaldo } from '@/lib/reportes/agrupar'
import { entregasDelDia, hoyLima } from '@/lib/trabajos/agenda'
import { veMontos } from '@/lib/permisos'
import type { Perfil } from '@/lib/supabase/types'
import type { TrabajoListItem } from '@/lib/trabajos/types'

export interface ResumenHoy {
  entregasHoy: number
  enCurso: number
  porCobrar: number
}

/** KPIs de la pantalla Hoy. Puro. */
export function resumenHoy(
  trabajos: readonly { estado: string; fecha_entrega: string | null; saldo: number }[],
  hoy: string,
): ResumenHoy {
  return {
    entregasHoy: trabajos.filter((t) => t.fecha_entrega === hoy).length,
    enCurso: trabajos.filter((t) => t.estado === 'en_curso').length,
    porCobrar:
      Math.round(trabajos.reduce((s, t) => s + Math.max(0, t.saldo), 0) * 100) / 100,
  }
}

export interface FilaDeuda {
  id: string
  nombre: string
  detalle: string
  saldo: number
}

/** Consultorios que más deben, con su detalle legible. Puro. */
export function topDeuda(
  grupos: readonly {
    consultorio_id: string
    consultorio: string
    saldo: number
    doctores: readonly { doctor: string; filas: readonly unknown[] }[]
  }[],
  n: number,
): FilaDeuda[] {
  return grupos
    .filter((g) => g.saldo > 0.001)
    .slice(0, n)
    .map((g) => {
      const trabajos = g.doctores.reduce((s, d) => s + d.filas.length, 0)
      const doctores = g.doctores.map((d) => d.doctor).join(', ')
      return {
        id: g.consultorio_id,
        nombre: g.consultorio,
        detalle: `${doctores} · ${trabajos} trabajo${trabajos === 1 ? '' : 's'}`,
        saldo: g.saldo,
      }
    })
}

export interface DatosHoy {
  hoy: string
  entregas: TrabajoListItem[]
  resumen: ResumenHoy
  deuda: FilaDeuda[]
  montos: boolean
}

/** Todo lo que pinta la pantalla Hoy. La deuda solo para quien ve importes. */
export async function datosHoy(perfil: Perfil | null): Promise<DatosHoy> {
  const hoy = hoyLima()
  const montos = veMontos(perfil)
  const trabajos = await listTrabajos()
  const entregas = entregasDelDia(
    trabajos.filter((t) => t.estado === 'en_curso'),
    hoy,
  )
  const deuda = montos
    ? topDeuda(agruparPorConsultorio(soloConSaldo(await filasReporte())).grupos, 4)
    : []
  return { hoy, entregas, resumen: resumenHoy(trabajos, hoy), deuda, montos }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa** → PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/hoy/
git commit -m "feat(hoy): datos de la agenda del dia"
```

---

### Task 3: Pantalla Hoy — Dirección A

**Files:**
- Modify: `app/(app)/hoy/page.tsx`

**Interfaces:**
- Consumes: `datosHoy`, `fechaLarga`, `KpiTile`, `Card`, `Chip`, `colorConsultorio`, `formatMoney`.

- [ ] **Step 1: Reescribir la pantalla**

```tsx
import Link from 'next/link'
import { getSessionPerfil } from '@/lib/auth'
import { puede } from '@/lib/permisos'
import { listProductos } from '@/lib/inventario/data'
import { datosHoy } from '@/lib/hoy/data'
import { fechaLarga } from '@/lib/trabajos/agenda'
import { colorConsultorio } from '@/lib/consultorios/color'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { KpiTile } from '@/components/ui/KpiTile'

export default async function HoyPage() {
  const perfil = await getSessionPerfil()
  const veInventario = puede(perfil, 'inventario_ver')
  const [datos, productos] = await Promise.all([
    datosHoy(perfil),
    veInventario ? listProductos() : Promise.resolve([]),
  ])
  const stockBajo = productos.filter((p) => p.stock_actual <= p.stock_minimo)

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
          {fechaLarga(datos.hoy)}
        </p>
        <h1 className="text-[30px] font-bold leading-tight tracking-[-0.03em]">Hoy</h1>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
        <KpiTile etiqueta="Entregas de hoy" valor={String(datos.resumen.entregasHoy)} />
        <KpiTile etiqueta="En curso" valor={String(datos.resumen.enCurso)} />
        {datos.montos ? (
          <KpiTile
            etiqueta="Por cobrar"
            valor={formatMoney(datos.resumen.porCobrar)}
            tono="peligro"
          />
        ) : null}
      </div>

      {veInventario && stockBajo.length > 0 ? (
        <Link
          href="/inventario"
          className="block rounded-[var(--radius-lg)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm"
        >
          {stockBajo.length} insumo{stockBajo.length === 1 ? '' : 's'} en stock bajo — toca
          para revisar.
        </Link>
      ) : null}

      <Link
        href="/trabajos/nuevo"
        className="flex h-14 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-accent)] text-[16.5px] font-semibold text-[var(--color-accent-contrast)] shadow-[0_6px_18px_var(--color-accent-glow)] transition-transform active:scale-[0.99]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nuevo trabajo
      </Link>

      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[17px] font-bold">Agenda de entregas</h2>
          <Link href="/trabajos" className="text-[13.5px] font-semibold text-[var(--color-accent)]">
            Ver todos →
          </Link>
        </div>

        {datos.entregas.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[var(--color-border)] p-6 text-center">
            <p className="text-[15px] font-semibold">Sin entregas para hoy</p>
            <p className="mt-0.5 text-[13.5px] text-[var(--color-muted)]">
              Los trabajos con otra fecha están en Trabajos.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {datos.entregas.map((t) => (
              <li key={t.id}>
                <Link href={`/trabajos/${t.id}`} className="block">
                  <Card
                    tono="lista"
                    colorLateral={colorConsultorio(t.consultorio_nombre)}
                    className="px-3.5 py-3 transition-transform hover:-translate-y-px"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="titulo-balance text-[15.5px] font-semibold">
                          {t.tipo_nombre}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-[var(--color-muted)]">
                          {t.consultorio_nombre} · {t.doctor_nombre}
                          {t.paciente_nombre ? ` · ${t.paciente_nombre}` : ''}
                        </p>
                      </div>
                      {datos.montos ? (
                        <span className="num shrink-0 text-sm font-semibold">
                          {formatMoney(t.precio_acordado)}
                        </span>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {datos.montos && datos.deuda.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-bold">A quién cobrar</h2>
            <Link
              href="/consultorios/cuentas"
              className="text-[13.5px] font-semibold text-[var(--color-accent)]"
            >
              Estado de cuenta →
            </Link>
          </div>
          <Card>
            <ul>
              {datos.deuda.map((d, i) => (
                <li
                  key={d.id}
                  className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}
                >
                  <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colorConsultorio(d.nombre) }}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold">
                          {d.nombre}
                        </span>
                        <span className="block truncate text-[12.5px] text-[var(--color-muted)]">
                          {d.detalle}
                        </span>
                      </span>
                    </span>
                    <span className="num shrink-0 text-[15px] font-bold text-[var(--color-danger)]">
                      {formatMoney(d.saldo)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </section>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm vitest run && pnpm build` → todo en verde.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/hoy/page.tsx"
git commit -m "feat(hoy): agenda del dia con KPIs y top de deuda"
```

---

### Task 4: Lista de trabajos

**Files:**
- Create: `components/trabajos/TrabajoCard.tsx`
- Modify: `app/(app)/trabajos/page.tsx`
- Test: `components/trabajos/TrabajoCard.test.tsx`

**Interfaces:**
- Produces: `TrabajoCard({ trabajo, montos })` — tarjeta de tres filas del spec 5.3.

- [ ] **Step 1..5:** test → RED → implementación → GREEN → commit (código completo en la
  ejecución; la tarjeta usa `Card tono="lista"`, `colorLateral`, `EstadoBadge`, `PagoChip`
  y el precio en `.num`).

---

### Task 5: Hoja de selección de tipo y formulario de trabajo

**Files:**
- Create: `components/trabajos/TipoSheet.tsx`
- Delete: `components/trabajos/TipoCombobox.tsx`
- Modify: `components/trabajos/TrabajoForm.tsx`
- Test: `components/trabajos/TipoSheet.test.tsx`

**Interfaces:**
- Produces: `TipoSheet({ tipos, abierta, onCerrar, onElegir })` — hoja con buscador
  (`filtrarTipos`), agrupada por categoría, precio en mono a la derecha.

---

### Task 6: Ficha del trabajo, pagos y recibo

**Files:**
- Modify: `app/(app)/trabajos/[id]/page.tsx`, `components/trabajos/PagosSection.tsx`,
  `components/trabajos/ReciboTicket.tsx`

Incluye el arreglo del **título aplastado**: las acciones (Recibo · Editar · + Otro trabajo ·
Eliminar) pasan a su propia fila bajo la cabecera, como manda el spec 5.5.

---

## Verificación final de la fase

- `pnpm vitest run` y `pnpm build` en verde.
- Capturas en `docs/capturas/fase-2-movil` y `docs/capturas/fase-2-escritorio`, revisando:
  título del trabajo completo, hoja de tipos, barra de total, y que ninguna pantalla
  desborde en horizontal.
