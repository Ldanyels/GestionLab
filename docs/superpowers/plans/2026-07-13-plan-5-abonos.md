# GestionLab — Plan 5: Abonos y Pagos del cliente

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Registrar abonos por trabajo (adelanto = primer abono), ver total pagado y saldo pendiente, con alta y eliminación de abonos desde el detalle del trabajo.

**Architecture:** Tabla `abono` (uno-a-muchos con `trabajo`) con RLS. Lógica de saldo pura y testeable. Sección "Pagos" en el detalle del trabajo.

**Tech Stack:** Next.js 16, Supabase, Zod, Vitest, Playwright.

## Global Constraints
- Tabla con `laboratorio_id` + RLS `laboratorio_actual()`.
- Borrado de abono con `ConfirmDialog`.
- Español, Soles, mobile-first, puerto 3100.

---

### Task 1: Migración (abono)
**Files:** Create `supabase/migrations/0005_abonos.sql`
- `abono`: id, laboratorio_id, trabajo_id (fk cascade), monto numeric(10,2) > 0, fecha date default current_date, metodo text, nota text null, creado_en.
- RLS `for all`.
- [ ] Escribir → ejecutar → commit.

### Task 2: Tipos, validación, saldo (tests) y datos
**Files:** `lib/abonos/{types,schema,saldo,data}.ts` + `lib/abonos/__tests__/saldo.test.ts`
- `saldo.ts` (puro): `totalPagado(abonos)`, `saldoPendiente(precio, abonos)`, `estadoPago(precio, pagado)` → 'pendiente'|'parcial'|'pagado'.
- `data.ts`: `listAbonos(trabajoId)`, `crearAbono(trabajoId, input)`, `eliminarAbono(id)`.
- [ ] Tests de saldo (RED→GREEN) → commit.

### Task 3: Sección de pagos en el detalle del trabajo
**Files:** Modify `app/(app)/trabajos/[id]/page.tsx`; Create `app/(app)/trabajos/[id]/pagos-actions.ts` (o extender actions), `components/trabajos/PagosSection.tsx` + `AbonoForm.tsx`.
- Muestra total pagado, saldo (con color), lista de abonos con fecha/método/monto y eliminar (confirm), y formulario de nuevo abono (monto, método, fecha, nota).
- [ ] Implementar → build + E2E existentes → commit.

## Self-Review
- Tabla/RLS → T1. Lógica/datos/tests → T2. UI pagos → T3. Adelanto = primer abono (sin caso especial).
