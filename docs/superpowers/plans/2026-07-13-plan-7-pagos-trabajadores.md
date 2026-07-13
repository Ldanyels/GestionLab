# GestionLab — Plan 7: Pagos a trabajadores

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Registrar trabajadores y sus pagos (registro simple), con montos estándar reutilizables por tipo de trabajo que se pueden seleccionar en un pago. Los pagos son gasto de personal para las Finanzas (Plan 8).

**Architecture:** Tablas `trabajador`, `monto_estandar`, `pago_trabajador` con RLS. Gestión bajo Configuración (solo admin). En el detalle del trabajador: presets de montos + registrar pago + historial.

**Tech Stack:** Next.js 16, Supabase, Zod, Vitest, Playwright.

## Global Constraints
- Tablas con `laboratorio_id` + RLS `laboratorio_actual()`. Solo admin.
- CRUD con editar+eliminar; borrados con `ConfirmDialog`. Fecha por defecto = hoy.
- Español, Soles, mobile-first, puerto 3100.

---

### Task 1: Migración (trabajador, monto_estandar, pago_trabajador)
**Files:** Create `supabase/migrations/0007_pagos_trabajadores.sql`
- `trabajador`: id, laboratorio_id, nombre, activo bool default true, creado_en.
- `monto_estandar`: id, laboratorio_id, trabajador_id (fk cascade), catalogo_trabajo_id (fk cascade), monto numeric(10,2)>0, unique(trabajador_id, catalogo_trabajo_id).
- `pago_trabajador`: id, laboratorio_id, trabajador_id (fk cascade), monto numeric(10,2)>0, fecha date default current_date, nota text, catalogo_trabajo_id uuid null (fk set null), creado_en.
- RLS `for all` en las tres.
- [ ] Escribir → ejecutar → commit.

### Task 2: Tipos, validación y datos (tests)
**Files:** `lib/trabajadores/{types,schema,data}.ts` + tests.
- `listTrabajadores`, `getTrabajador` (con presets + pagos + total pagado), `crear/editar/eliminarTrabajador`, `crear/eliminarPago`, `guardar/eliminarMontoEstandar`, `totalPagadoTrabajadores(periodo)` para Finanzas.
- [ ] Test schema → commit.

### Task 3: Configuración → Trabajadores (CRUD)
**Files:** Modify `configuracion/page.tsx` (sección Trabajadores); `configuracion/trabajadores/{page,actions}.tsx`, `.../nuevo`, `components/trabajadores/TrabajadorForm.tsx`.
- [ ] Implementar → build → commit.

### Task 4: Detalle del trabajador (montos estándar + pagos)
**Files:** `configuracion/trabajadores/[id]/page.tsx`; `components/trabajadores/{MontoEstandarEditor,PagoForm}.tsx`.
- Registrar pago (monto, fecha=hoy, método/nota, opción de elegir un preset por tipo de trabajo que autocompleta el monto). Historial + total. Gestión de presets.
- [ ] Implementar → E2E guard → build → commit.

## Self-Review
- Tablas/RLS → T1. Datos → T2. CRUD trabajadores → T3. Presets+pagos → T4. Total pagado alimenta Finanzas (Plan 8).
