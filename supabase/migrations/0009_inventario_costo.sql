-- ============================================================
-- GestionLab — Migración 0009: costo por movimiento + consumo por producto
-- ============================================================

-- Costo unitario capturado en el movimiento (ej. precio de compra del proveedor).
alter table movimiento_inventario
  add column if not exists costo_unitario numeric(10,2);

-- Consumo de insumos (salida + merma) valorizado, por producto, en un periodo.
create or replace function consumo_por_producto(p_desde date, p_hasta date)
returns table(producto text, cantidad numeric, costo numeric)
language sql stable
as $$
  select p.nombre as producto,
         sum(abs(m.cantidad))::numeric as cantidad,
         sum(abs(m.cantidad) * p.costo_unitario)::numeric as costo
  from movimiento_inventario m
  join producto p on p.id = m.producto_id
  where m.tipo in ('salida','merma') and m.fecha between p_desde and p_hasta
  group by p.nombre
  order by sum(abs(m.cantidad) * p.costo_unitario) desc
  limit 8;
$$;

grant execute on function consumo_por_producto(date, date) to authenticated;
