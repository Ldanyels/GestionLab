# GestionLab — Plan 6: Inventario y Recetas

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Gestionar productos/insumos con stock, registrar movimientos (ingreso/salida/ajuste/merma), definir recetas por tipo de trabajo, descontar stock automáticamente al cerrar un trabajo, y liquidar la merma por periodo.

**Architecture:** Tablas `producto`, `movimiento_inventario`, `receta`. Un trigger mantiene `producto.stock_actual` a partir de los movimientos (delta con signo). Recetas se gestionan desde el catálogo. Al cerrar un trabajo se generan salidas según la receta (idempotente). Liquidación registra merma como ajuste.

**Tech Stack:** Next.js 16, Supabase, Zod, Vitest, Playwright.

## Global Constraints
- Tablas con `laboratorio_id` + RLS `laboratorio_actual()`.
- CRUD con editar+eliminar; borrados con `ConfirmDialog`. Fechas por defecto = hoy (local).
- Inventario y Finanzas: solo admin (por ahora Inventario visible a admin en la nav).
- Español, Soles, mobile-first, puerto 3100.

---

### Task 1: Migración (producto, movimiento_inventario, receta) + trigger de stock
**Files:** Create `supabase/migrations/0006_inventario.sql`
- `producto`: id, laboratorio_id, nombre, unidad (default 'unidad'), stock_actual numeric(12,3) default 0, stock_minimo numeric(12,3) default 0, costo_unitario numeric(10,2) default 0, activo bool default true, creado_en.
- `movimiento_inventario`: id, laboratorio_id, producto_id (fk cascade), tipo ('ingreso'|'salida'|'ajuste'|'merma'), cantidad numeric(12,3) (delta con signo), motivo text, trabajo_id uuid null (fk set null), fecha date default current_date, creado_por uuid default auth.uid(), creado_en.
- `receta`: id, laboratorio_id, catalogo_trabajo_id (fk cascade), producto_id (fk cascade), cantidad numeric(12,3) > 0, unique(catalogo_trabajo_id, producto_id).
- Trigger `aplicar_movimiento_stock` (after insert/delete) actualiza `producto.stock_actual`.
- RLS `for all` en las tres.
- [ ] Escribir → ejecutar → commit.

### Task 2: Productos (datos + UI CRUD)
**Files:** `lib/inventario/{types,schema,data}.ts` + tests; `app/(app)/inventario/{page,actions}.tsx`, `.../productos/...`; guard admin.
- [ ] Tests schema → implementar → build → commit.

### Task 3: Movimientos (ingreso/salida/ajuste) + historial + stock bajo
**Files:** extender `lib/inventario/data.ts` (registrarMovimiento, listMovimientos); `components/inventario/...`; UI en detalle de producto.
- [ ] Implementar → build → commit.

### Task 4: Recetas por tipo de trabajo
**Files:** `lib/recetas/{schema,data}.ts`; UI en `configuracion/catalogo/[id]` (agregar/quitar insumo+cantidad).
- [ ] Implementar → build → commit.

### Task 5: Descuento automático al cerrar trabajo (idempotente)
**Files:** extender cierre de trabajo: al pasar a 'cerrado', generar salidas por receta si aún no se generaron (marcar con motivo/telemetría). Evitar doble descuento.
- [ ] Lógica idempotente + test → build → commit.

### Task 6: Liquidación / Merma por periodo
**Files:** `supabase/migrations/0007_liquidacion.sql` (tabla `liquidacion` opcional); UI para conteo físico vs teórico → registrar merma como movimiento 'merma'.
- [ ] Implementar → build → commit.

## Self-Review
- Tablas/trigger → T1. Productos → T2. Movimientos → T3. Recetas → T4. Auto-descuento → T5. Merma → T6.
