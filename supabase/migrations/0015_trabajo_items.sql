-- ============================================================
-- GestionLab — Migración 0015: Líneas de trabajo por cuenta
-- Un trabajo (cuenta) puede incluir varios tipos del catálogo.
-- ============================================================

create table if not exists trabajo_item (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  trabajo_id uuid not null references trabajo(id) on delete cascade,
  catalogo_trabajo_id uuid not null references catalogo_trabajo(id) on delete restrict,
  cantidad int not null default 1 check (cantidad >= 1),
  variable_cantidad int not null default 0 check (variable_cantidad >= 0),
  precio_unitario numeric(10,2) not null default 0 check (precio_unitario >= 0),
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  pieza text,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);
create index if not exists idx_titem_trabajo on trabajo_item(trabajo_id);
create index if not exists idx_titem_lab on trabajo_item(laboratorio_id);

alter table trabajo_item enable row level security;

drop policy if exists trabajo_item_rw on trabajo_item;
create policy trabajo_item_rw on trabajo_item for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());

-- Backfill: cada trabajo existente se convierte en una cuenta con 1 línea.
insert into trabajo_item (
  laboratorio_id, trabajo_id, catalogo_trabajo_id,
  cantidad, variable_cantidad, precio_unitario, subtotal, pieza, orden
)
select
  t.laboratorio_id, t.id, t.catalogo_trabajo_id,
  t.cantidad, t.variable_cantidad,
  case when t.cantidad > 0 then round(t.precio_acordado / t.cantidad, 2)
       else t.precio_acordado end,
  t.precio_acordado, t.pieza, 1
from trabajo t
where not exists (select 1 from trabajo_item ti where ti.trabajo_id = t.id);
