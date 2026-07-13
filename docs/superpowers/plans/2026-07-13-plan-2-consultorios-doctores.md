# GestionLab — Plan 2: Consultorios y Doctores

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Gestionar consultorios (clínicas cliente) y sus doctores (fuente de referencia), con CRUD completo, aislamiento por laboratorio (RLS) y UX mobile-first.

**Architecture:** Tablas `consultorio` y `doctor` en Supabase con RLS por `laboratorio_actual()`. Capa de datos en `lib/` (Server Components para lectura, Server Actions para escritura). Validación con Zod. Nueva entrada "Consultorios" en la navegación.

**Tech Stack:** Next.js 16 (App Router), Supabase, Zod, Vitest, Playwright.

## Global Constraints
- Toda tabla nueva: `laboratorio_id uuid not null references laboratorio(id)` + política RLS `using/with check (laboratorio_id = laboratorio_actual())`.
- Español, Soles, mobile-first, objetivos táctiles ≥44px.
- Validación de entrada con Zod en cada Server Action.
- Puerto de dev/prod: 3100.

---

### Task 1: Migración DB (consultorio + doctor + RLS)

**Files:**
- Create: `supabase/migrations/0002_consultorios_doctores.sql`

- [ ] **Step 1:** Escribir la migración.

```sql
-- Consultorios (clínicas cliente) y doctores (fuente de referencia)
create table if not exists consultorio (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  nombre text not null,
  contacto text,
  notas text,
  creado_en timestamptz not null default now()
);
create index if not exists idx_consultorio_lab on consultorio(laboratorio_id);

create table if not exists doctor (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  consultorio_id uuid not null references consultorio(id) on delete cascade,
  nombre text not null,
  contacto text,
  creado_en timestamptz not null default now()
);
create index if not exists idx_doctor_consultorio on doctor(consultorio_id);
create index if not exists idx_doctor_lab on doctor(laboratorio_id);

alter table consultorio enable row level security;
alter table doctor enable row level security;

drop policy if exists consultorio_rw on consultorio;
create policy consultorio_rw on consultorio for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());

drop policy if exists doctor_rw on doctor;
create policy doctor_rw on doctor for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());
```

- [ ] **Step 2:** Ejecutar en Supabase SQL Editor. Verificar tablas creadas.
- [ ] **Step 3:** Commit.

---

### Task 2: Tipos, validación y capa de datos

**Files:**
- Create: `lib/consultorios/types.ts`, `lib/consultorios/schema.ts`, `lib/consultorios/data.ts`
- Create: `lib/consultorios/__tests__/schema.test.ts`

**Interfaces:**
- Produces: `Consultorio`, `Doctor`, `ConsultorioConDoctores`; `consultorioSchema`, `doctorSchema` (Zod); `listConsultorios()`, `getConsultorio(id)`, `crear/editar/eliminarConsultorio`, `crear/eliminarDoctor`.

- [ ] **Step 1:** Instalar Zod: `pnpm add zod`.
- [ ] **Step 2:** Tests de los esquemas Zod (nombre requerido, contacto opcional). RED.
- [ ] **Step 3:** Implementar tipos, esquemas y funciones de datos. GREEN.
- [ ] **Step 4:** Commit.

---

### Task 3: Navegación + listado y alta de consultorios

**Files:**
- Modify: `components/nav/BottomNav.tsx` + test (añadir "Consultorios")
- Create: `app/(app)/consultorios/page.tsx`, `app/(app)/consultorios/actions.ts`, `app/(app)/consultorios/nuevo/page.tsx`
- Create: `components/consultorios/ConsultorioForm.tsx`

- [ ] **Step 1:** Test de `navItemsFor` (incluye "Consultorios"). RED→GREEN.
- [ ] **Step 2:** Server Actions crear/editar/eliminar consultorio.
- [ ] **Step 3:** Página listado + página nuevo con formulario.
- [ ] **Step 4:** Commit.

---

### Task 4: Detalle de consultorio + doctores

**Files:**
- Create: `app/(app)/consultorios/[id]/page.tsx`
- Create: `components/consultorios/DoctorForm.tsx`
- Modify: `app/(app)/consultorios/actions.ts` (crear/eliminar doctor)

- [ ] **Step 1:** Server Actions crear/eliminar doctor.
- [ ] **Step 2:** Página de detalle: datos del consultorio + lista de doctores + alta de doctor + editar/eliminar consultorio.
- [ ] **Step 3:** E2E: flujo crear consultorio → ver detalle → agregar doctor.
- [ ] **Step 4:** Commit.

---

## Self-Review
- Tablas + RLS → Task 1.
- Tipos/validación/datos → Task 2.
- Listado/alta + nav → Task 3.
- Detalle + doctores + E2E → Task 4.
- Aislamiento multi-inquilino: todas las tablas con `laboratorio_id` + RLS.
