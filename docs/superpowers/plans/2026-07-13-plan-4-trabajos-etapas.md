# GestionLab — Plan 4: Trabajos y Etapas

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Crear y seguir trabajos: asignarlos a un doctor, elegir tipo del catálogo (precio automático con override manual), copiar las etapas de la plantilla, avanzar/excluir etapas y cerrar/entregar el trabajo. Es el núcleo operativo.

**Architecture:** Tablas `trabajo` y `trabajo_etapa` con RLS. Al crear un trabajo se copian las `plantilla_etapa` del tipo. Precio efectivo calculado server-side desde el catálogo (o manual). "Hoy" y "Trabajos" muestran los trabajos.

**Tech Stack:** Next.js 16, Supabase, Zod, Vitest, Playwright.

## Global Constraints
- Tablas con `laboratorio_id` + RLS `laboratorio_actual()`.
- CRUD con editar+eliminar; borrados/acciones destructivas con `ConfirmDialog`.
- Precio del trabajo: server recalcula desde catálogo salvo override manual (integridad).
- Español, Soles, mobile-first, puerto 3100.

---

### Task 1: Migración (trabajo + trabajo_etapa)
**Files:** Create `supabase/migrations/0004_trabajos_etapas.sql`
- `trabajo`: id, laboratorio_id, doctor_id (fk restrict), catalogo_trabajo_id (fk restrict), paciente_nombre (null), fecha_ingreso date default current_date, fecha_entrega date null, estado ('en_curso'|'cerrado'|'entregado'), precio_acordado numeric(10,2), variable_cantidad int default 0, notas text null, creado_en.
- `trabajo_etapa`: id, laboratorio_id, trabajo_id (fk cascade), nombre, orden, estado ('pendiente'|'en_progreso'|'completada'|'excluida'), motivo_exclusion text null, fecha_cierre timestamptz null.
- RLS `for all` en ambas.
- [ ] Escribir → ejecutar en Supabase → commit.

### Task 2: Tipos, validación, datos y lógica (con tests)
**Files:** `lib/trabajos/{types,schema,estado,data}.ts` + tests.
- `estado.ts`: helpers puros — `progresoTrabajo(etapas)` (% completadas sobre no-excluidas), `siguienteEstadoEtapa(actual)`, etiquetas.
- `data.ts`: `listTrabajos(filtro?)`, `getTrabajo(id)`, `crearTrabajo(input)` (copia etapas de plantilla, calcula precio), `editarTrabajo`, `eliminarTrabajo`, `cambiarEstadoTrabajo`, `marcarEtapa(id, estado, motivo?)`.
- [ ] Tests de `estado.ts` y del cálculo de precio (RED→GREEN) → commit.

### Task 3: Listado y creación de trabajos (reemplaza placeholder /trabajos)
**Files:** `app/(app)/trabajos/{page,actions}.tsx`, `.../nuevo/page.tsx`, `components/trabajos/TrabajoForm.tsx` (client, precio en vivo).
- [ ] Implementar → build → commit.

### Task 4: Detalle de trabajo + gestión de etapas + cierre
**Files:** `app/(app)/trabajos/[id]/page.tsx`, `.../[id]/editar/page.tsx`, `components/trabajos/EtapaAcciones.tsx` (completar/excluir/reabrir), acciones de estado y cierre.
- [ ] Implementar → E2E (trabajos exige sesión) → build → commit.

### Task 5: Dashboard "Hoy"
**Files:** Modify `app/(app)/hoy/page.tsx` — trabajos en curso / del día, con acceso rápido.
- [ ] Implementar → build → commit.

## Self-Review
- Tablas/RLS → T1. Lógica+datos+tests → T2. Listado/alta → T3. Detalle/etapas/cierre → T4. Hoy → T5.
- Abonos: Plan 5. Consumo de inventario al cerrar: Plan 6 (se conectará luego).
