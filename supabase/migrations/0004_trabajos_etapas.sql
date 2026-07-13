-- ============================================================
-- GestionLab — Migración 0004: Trabajos y Etapas
-- ============================================================

create table if not exists trabajo (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  doctor_id uuid not null references doctor(id) on delete restrict,
  catalogo_trabajo_id uuid not null references catalogo_trabajo(id) on delete restrict,
  paciente_nombre text,
  fecha_ingreso date not null default current_date,
  fecha_entrega date,
  estado text not null default 'en_curso'
    check (estado in ('en_curso','cerrado','entregado')),
  precio_acordado numeric(10,2) not null default 0 check (precio_acordado >= 0),
  variable_cantidad int not null default 0 check (variable_cantidad >= 0),
  notas text,
  creado_en timestamptz not null default now()
);
create index if not exists idx_trabajo_lab on trabajo(laboratorio_id);
create index if not exists idx_trabajo_doctor on trabajo(doctor_id);
create index if not exists idx_trabajo_estado on trabajo(laboratorio_id, estado);

create table if not exists trabajo_etapa (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  trabajo_id uuid not null references trabajo(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','en_progreso','completada','excluida')),
  motivo_exclusion text,
  fecha_cierre timestamptz,
  creado_en timestamptz not null default now()
);
create index if not exists idx_tetapa_trabajo on trabajo_etapa(trabajo_id);
create index if not exists idx_tetapa_lab on trabajo_etapa(laboratorio_id);

alter table trabajo enable row level security;
alter table trabajo_etapa enable row level security;

drop policy if exists trabajo_rw on trabajo;
create policy trabajo_rw on trabajo for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());

drop policy if exists trabajo_etapa_rw on trabajo_etapa;
create policy trabajo_etapa_rw on trabajo_etapa for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());
