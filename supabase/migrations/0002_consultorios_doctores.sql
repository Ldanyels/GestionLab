-- ============================================================
-- GestionLab — Migración 0002: Consultorios y Doctores
-- ============================================================

-- Consultorios (clínicas cliente)
create table if not exists consultorio (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  nombre text not null,
  contacto text,
  notas text,
  creado_en timestamptz not null default now()
);
create index if not exists idx_consultorio_lab on consultorio(laboratorio_id);

-- Doctores (fuente de referencia), pertenecen a un consultorio
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

-- RLS: cada laboratorio solo ve/gestiona lo suyo
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
