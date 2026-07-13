-- ============================================================
-- GestionLab — Migración 0005: Abonos (pagos del cliente por trabajo)
-- ============================================================

create table if not exists abono (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  trabajo_id uuid not null references trabajo(id) on delete cascade,
  monto numeric(10,2) not null check (monto > 0),
  fecha date not null default current_date,
  metodo text not null default 'efectivo',
  nota text,
  creado_en timestamptz not null default now()
);
create index if not exists idx_abono_trabajo on abono(trabajo_id);
create index if not exists idx_abono_lab on abono(laboratorio_id);

alter table abono enable row level security;

drop policy if exists abono_rw on abono;
create policy abono_rw on abono for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());
