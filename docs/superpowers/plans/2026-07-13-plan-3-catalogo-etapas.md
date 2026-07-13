# GestionLab — Plan 3: Catálogo de trabajos y Plantillas de etapas

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Gestionar el catálogo de tipos de trabajo (con precio base y componente variable) y sus plantillas de etapas, con semilla del catálogo real de MasterLab. Accesible desde una sección "Configuración" (solo admin).

**Architecture:** Tablas `catalogo_trabajo` y `plantilla_etapa` con RLS por laboratorio. Semilla de MasterLab por SQL (referida por nombre de laboratorio, no hardcodeando ids en migraciones). Área `/configuracion` (admin) con CRUD. Recetas se posponen al Plan 6 (requieren productos de inventario).

**Tech Stack:** Next.js 16, Supabase, Zod, Vitest, Playwright.

## Global Constraints
- Toda tabla: `laboratorio_id` + RLS `laboratorio_actual()`.
- CRUD con editar + eliminar; borrados con `ConfirmDialog`.
- Español, Soles, mobile-first. Puerto 3100.
- `/configuracion` y subrutas: solo rol `admin`.

---

### Task 1: Migración (catalogo_trabajo + plantilla_etapa)

**Files:** Create `supabase/migrations/0003_catalogo_etapas.sql`

Columnas:
- `catalogo_trabajo`: id, laboratorio_id, categoria (text), nombre (text), precio_base (numeric(10,2)), variable_etiqueta (text null), variable_precio_unitario (numeric(10,2) null), activo (bool default true), creado_en.
- `plantilla_etapa`: id, laboratorio_id, catalogo_trabajo_id (fk cascade), nombre (text), orden (int), creado_en.
- RLS `for all using/with check (laboratorio_id = laboratorio_actual())` en ambas.

- [ ] Escribir migración → ejecutar en Supabase → commit.

---

### Task 2: Semilla del catálogo MasterLab

**Files:** Create `supabase/seed/masterlab_catalogo.sql`

Inserta las 29 líneas del catálogo (4 categorías) para el laboratorio llamado 'MasterLab', con `on conflict do nothing`. Telescópicas: precio_base 120, variable_etiqueta 'cofia', variable_precio_unitario 20.

- [ ] Escribir seed → ejecutar en Supabase → commit.

---

### Task 3: Tipos, validación y capa de datos

**Files:** Create `lib/catalogo/{types,schema,data}.ts` + `lib/catalogo/__tests__/schema.test.ts`

- `CatalogoTrabajo`, `PlantillaEtapa`, `CatalogoConEtapas`.
- `catalogoSchema` (nombre, categoria requeridos; precio_base ≥ 0; variable opcional coherente), `etapaSchema`.
- `listCatalogo()`, `getCatalogoItem(id)`, `crear/editar/eliminarCatalogo`, `crear/editar/eliminar/reordenarEtapa`.
- Precio efectivo: helper `precioEfectivo(item, cantidadVariable)`.

- [ ] Tests de schema + `precioEfectivo` (RED→GREEN) → commit.

---

### Task 4: Configuración + CRUD de catálogo

**Files:**
- Modify: `app/(app)/layout.tsx` (link "Configuración" en header, solo admin)
- Create: `app/(app)/configuracion/page.tsx` (landing, guard admin)
- Create: `app/(app)/configuracion/catalogo/{page,actions}.tsx`, `.../nuevo/page.tsx`, `.../[id]/page.tsx`, `.../[id]/editar/page.tsx`
- Create: `components/catalogo/CatalogoForm.tsx`

- Listado agrupado por categoría, con precio formateado (S/). Alta/edición con campos de componente variable. Borrado con ConfirmDialog. Guard admin en todas las páginas.

- [ ] Implementar → build → commit.

---

### Task 5: Plantillas de etapas por tipo de trabajo

**Files:**
- Modify: `app/(app)/configuracion/catalogo/[id]/page.tsx` (sección etapas)
- Create: `components/catalogo/EtapasEditor.tsx` (agregar/editar/eliminar/reordenar)
- Modify: catalogo actions (etapas)

- [ ] Implementar → E2E (configuración exige admin/login) → build → commit.

---

## Self-Review
- Catálogo + etapas tablas/RLS → Task 1.
- Semilla MasterLab → Task 2.
- Datos/validación/precio efectivo → Task 3.
- CRUD catálogo + guard admin → Task 4.
- Plantillas de etapas → Task 5.
- Recetas: fuera de alcance (Plan 6, requieren productos).
