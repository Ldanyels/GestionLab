-- ============================================================
-- GestionLab — Migración 0003: Catálogo de trabajos y Plantillas de etapas
-- ============================================================

create table if not exists catalogo_trabajo (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  categoria text not null,
  nombre text not null,
  precio_base numeric(10,2) not null default 0 check (precio_base >= 0),
  variable_etiqueta text,
  variable_precio_unitario numeric(10,2) check (variable_precio_unitario >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create index if not exists idx_catalogo_lab on catalogo_trabajo(laboratorio_id);

create table if not exists plantilla_etapa (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  catalogo_trabajo_id uuid not null references catalogo_trabajo(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);
create index if not exists idx_etapa_catalogo on plantilla_etapa(catalogo_trabajo_id);
create index if not exists idx_etapa_lab on plantilla_etapa(laboratorio_id);

alter table catalogo_trabajo enable row level security;
alter table plantilla_etapa enable row level security;

drop policy if exists catalogo_rw on catalogo_trabajo;
create policy catalogo_rw on catalogo_trabajo for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());

drop policy if exists etapa_rw on plantilla_etapa;
create policy etapa_rw on plantilla_etapa for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());
