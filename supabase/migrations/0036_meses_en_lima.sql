-- La serie de meses de Finanzas, contada desde Lima.
--
-- `current_date` en PostgreSQL es la fecha en UTC, y Lima va cinco horas por
-- detrás: desde las 19:00 del último día del mes, la base ya está en el mes
-- siguiente. El 30 de septiembre a las 20:08 esta función devolvía la serie
-- terminada en octubre, y la gráfica de Finanzas enseñaba un mes que todavía
-- no había empezado.
--
-- Es el mismo arreglo que hizo la 0033 con los valores por defecto de las
-- tablas; aquella no llegó a los cuerpos de las funciones.
--
-- Solo cambia la línea del `current_date`. El resto es idéntico, pero
-- `create or replace` exige el cuerpo entero.

create or replace function finanzas_por_mes(p_meses int)
returns table(mes date, ingresos numeric, gastos numeric)
language sql stable
as $$
  with meses as (
    select (
      date_trunc('month', (now() at time zone 'America/Lima')::date)
      - (interval '1 month' * g)
    )::date as m
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
