-- ============================================================
-- GestionLab — Migración 0008: Funciones de agregación financiera
-- (security invoker → respetan RLS: cada laboratorio ve solo lo suyo)
-- ============================================================

-- Resumen del periodo: ingresos (abonos), materiales consumidos (salida+merma
-- valorizados a costo), pagos a trabajadores.
create or replace function finanzas_resumen(p_desde date, p_hasta date)
returns table(ingresos numeric, materiales numeric, pagos numeric)
language sql stable
as $$
  select
    coalesce((
      select sum(monto) from abono
      where fecha between p_desde and p_hasta
    ), 0)::numeric as ingresos,
    coalesce((
      select sum(abs(m.cantidad) * p.costo_unitario)
      from movimiento_inventario m
      join producto p on p.id = m.producto_id
      where m.tipo in ('salida','merma') and m.fecha between p_desde and p_hasta
    ), 0)::numeric as materiales,
    coalesce((
      select sum(monto) from pago_trabajador
      where fecha between p_desde and p_hasta
    ), 0)::numeric as pagos;
$$;

-- Ingresos y gastos por mes (últimos p_meses meses, ascendente).
create or replace function finanzas_por_mes(p_meses int)
returns table(mes date, ingresos numeric, gastos numeric)
language sql stable
as $$
  with meses as (
    select (date_trunc('month', current_date) - (interval '1 month' * g))::date as m
    from generate_series(0, greatest(p_meses, 1) - 1) as g
  )
  select
    mm.m as mes,
    coalesce((
      select sum(a.monto) from abono a
      where date_trunc('month', a.fecha) = mm.m
    ), 0)::numeric as ingresos,
    (
      coalesce((
        select sum(abs(mo.cantidad) * pr.costo_unitario)
        from movimiento_inventario mo
        join producto pr on pr.id = mo.producto_id
        where mo.tipo in ('salida','merma') and date_trunc('month', mo.fecha) = mm.m
      ), 0)
      + coalesce((
        select sum(pt.monto) from pago_trabajador pt
        where date_trunc('month', pt.fecha) = mm.m
      ), 0)
    )::numeric as gastos
  from meses mm
  order by mm.m asc;
$$;

-- Ranking de consultorios por ingreso (abonos) en el periodo.
create or replace function ranking_consultorios(p_desde date, p_hasta date)
returns table(consultorio text, ingreso numeric)
language sql stable
as $$
  select c.nombre as consultorio, sum(a.monto)::numeric as ingreso
  from abono a
  join trabajo t on t.id = a.trabajo_id
  join doctor d on d.id = t.doctor_id
  join consultorio c on c.id = d.consultorio_id
  where a.fecha between p_desde and p_hasta
  group by c.nombre
  order by sum(a.monto) desc
  limit 10;
$$;

grant execute on function finanzas_resumen(date, date) to authenticated;
grant execute on function finanzas_por_mes(int) to authenticated;
grant execute on function ranking_consultorios(date, date) to authenticated;
