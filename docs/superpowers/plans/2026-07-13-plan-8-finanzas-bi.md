# GestionLab — Plan 8: Finanzas y BI

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Panel financiero: Ingresos (abonos) − Gastos (materiales consumidos + merma + pagos a trabajadores) = Utilidad, con KPIs y gráficos (utilidad/ingresos-gastos por mes, ranking de consultorios). Solo admin.

**Architecture:** Funciones SQL de agregación (respetan RLS por invoker) para resumen, por-mes y ranking. Capa de datos vía `rpc`. Página `/finanzas` con stat tiles + gráficos Recharts (paleta validada CVD). Materiales consumidos = valor (costo_unitario) de movimientos 'salida' y 'merma' del periodo (sin doble conteo: son movimientos distintos).

**Tech Stack:** Next.js 16, Supabase (SQL functions), Recharts, Vitest.

## Global Constraints
- Solo admin (`requireAdmin`). Español, Soles, mobile-first, puerto 3100.
- Paleta charts: Ingresos `#2563eb`, Gastos `#d97706` (validada). KPIs como stat tiles, no charts. Una sola escala por eje.

---

### Task 1: Migración de funciones de agregación
**Files:** Create `supabase/migrations/0008_finanzas.sql`
- `finanzas_resumen(desde, hasta)` → (ingresos, materiales, pagos).
- `finanzas_por_mes(meses int)` → (mes date, ingresos, gastos).
- `ranking_consultorios(desde, hasta)` → (consultorio text, ingreso).
- [ ] Escribir → ejecutar → commit.

### Task 2: Capa de datos + cálculo (tests)
**Files:** `lib/finanzas/{calculo,data}.ts` + `lib/finanzas/__tests__/calculo.test.ts`
- `utilidad(ingresos, gastos)`, `desgloseGastos(materiales, pagos)` puros y testeados.
- `data.ts`: `resumen(desde,hasta)`, `porMes(n)`, `rankingConsultorios(desde,hasta)`, y `rangoMesActual()`.
- [ ] Test cálculo → commit.

### Task 3: Página /finanzas (KPIs + charts)
**Files:** `app/(app)/finanzas/page.tsx` (guard admin, selector de periodo por searchParams); `components/finanzas/{KpiTiles,BarrasMensuales,RankingConsultorios}.tsx`.
- [ ] Instalar recharts → implementar → build + E2E guard → commit.

## Self-Review
- Funciones SQL → T1. Cálculo/datos → T2. UI/charts → T3. Ecuación Utilidad = Ingresos − (materiales+merma+pagos).
