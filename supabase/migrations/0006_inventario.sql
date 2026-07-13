-- ============================================================
-- GestionLab — Migración 0006: Inventario (productos, movimientos, recetas)
-- ============================================================

create table if not exists producto (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  nombre text not null,
  unidad text not null default 'unidad',
  stock_actual numeric(12,3) not null default 0,
  stock_minimo numeric(12,3) not null default 0,
  costo_unitario numeric(10,2) not null default 0 check (costo_unitario >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create index if not exists idx_producto_lab on producto(laboratorio_id);

create table if not exists movimiento_inventario (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  producto_id uuid not null references producto(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso','salida','ajuste','merma')),
  cantidad numeric(12,3) not null,             -- delta con signo aplicado al stock
  motivo text,
  trabajo_id uuid references trabajo(id) on delete set null,
  fecha date not null default current_date,
  creado_por uuid default auth.uid(),
  creado_en timestamptz not null default now()
);
create index if not exists idx_mov_producto on movimiento_inventario(producto_id);
create index if not exists idx_mov_lab on movimiento_inventario(laboratorio_id);
create index if not exists idx_mov_trabajo on movimiento_inventario(trabajo_id);

create table if not exists receta (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  catalogo_trabajo_id uuid not null references catalogo_trabajo(id) on delete cascade,
  producto_id uuid not null references producto(id) on delete cascade,
  cantidad numeric(12,3) not null check (cantidad > 0),
  creado_en timestamptz not null default now(),
  unique (catalogo_trabajo_id, producto_id)
);
create index if not exists idx_receta_catalogo on receta(catalogo_trabajo_id);
create index if not exists idx_receta_lab on receta(laboratorio_id);

-- Trigger: mantener stock_actual a partir de los movimientos (delta con signo)
create or replace function aplicar_movimiento_stock()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'INSERT') then
    update producto set stock_actual = stock_actual + NEW.cantidad
      where id = NEW.producto_id;
  elsif (TG_OP = 'DELETE') then
    update producto set stock_actual = stock_actual - OLD.cantidad
      where id = OLD.producto_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_mov_stock on movimiento_inventario;
create trigger trg_mov_stock
  after insert or delete on movimiento_inventario
  for each row execute function aplicar_movimiento_stock();

alter table producto enable row level security;
alter table movimiento_inventario enable row level security;
alter table receta enable row level security;

drop policy if exists producto_rw on producto;
create policy producto_rw on producto for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());

drop policy if exists movimiento_rw on movimiento_inventario;
create policy movimiento_rw on movimiento_inventario for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());

drop policy if exists receta_rw on receta;
create policy receta_rw on receta for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());
