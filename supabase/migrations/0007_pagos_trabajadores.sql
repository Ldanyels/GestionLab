-- ============================================================
-- GestionLab — Migración 0007: Trabajadores y sus pagos
-- ============================================================

create table if not exists trabajador (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  nombre text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create index if not exists idx_trabajador_lab on trabajador(laboratorio_id);

-- Montos estándar reutilizables por (trabajador, tipo de trabajo)
create table if not exists monto_estandar (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  trabajador_id uuid not null references trabajador(id) on delete cascade,
  catalogo_trabajo_id uuid not null references catalogo_trabajo(id) on delete cascade,
  monto numeric(10,2) not null check (monto > 0),
  creado_en timestamptz not null default now(),
  unique (trabajador_id, catalogo_trabajo_id)
);
create index if not exists idx_monto_trabajador on monto_estandar(trabajador_id);
create index if not exists idx_monto_lab on monto_estandar(laboratorio_id);

-- Registro simple de pagos al trabajador
create table if not exists pago_trabajador (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  trabajador_id uuid not null references trabajador(id) on delete cascade,
  monto numeric(10,2) not null check (monto > 0),
  fecha date not null default current_date,
  nota text,
  catalogo_trabajo_id uuid references catalogo_trabajo(id) on delete set null,
  creado_en timestamptz not null default now()
);
create index if not exists idx_pagot_trabajador on pago_trabajador(trabajador_id);
create index if not exists idx_pagot_lab on pago_trabajador(laboratorio_id);
create index if not exists idx_pagot_fecha on pago_trabajador(laboratorio_id, fecha);

alter table trabajador enable row level security;
alter table monto_estandar enable row level security;
alter table pago_trabajador enable row level security;

drop policy if exists trabajador_rw on trabajador;
create policy trabajador_rw on trabajador for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());

drop policy if exists monto_estandar_rw on monto_estandar;
create policy monto_estandar_rw on monto_estandar for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());

drop policy if exists pago_trabajador_rw on pago_trabajador;
create policy pago_trabajador_rw on pago_trabajador for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());
