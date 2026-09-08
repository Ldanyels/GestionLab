-- ============================================================
-- GestionLab — Migración 0017: Deuda agregada por consultorio
-- Evita traer todos los trabajos al servidor solo para sumar.
-- Sin `security definer`: las políticas RLS aplican y el
-- resultado queda acotado al laboratorio del usuario.
-- ============================================================

create or replace function deuda_por_consultorio()
returns table(
  consultorio_id uuid,
  consultorio text,
  doctores bigint,
  trabajos bigint,
  facturado numeric,
  pagado numeric,
  saldo numeric
)
language sql
stable
as $$
  with trabajos as (
    select
      c.id as consultorio_id,
      c.nombre as consultorio,
      d.id as doctor_id,
      t.id as trabajo_id,
      t.precio_acordado
    from consultorio c
    join doctor d on d.consultorio_id = c.id
    join trabajo t on t.doctor_id = d.id
  ),
  pagos as (
    select tr.trabajo_id, coalesce(sum(a.monto), 0) as pagado
    from trabajos tr
    left join abono a on a.trabajo_id = tr.trabajo_id
    group by tr.trabajo_id
  )
  select
    tr.consultorio_id,
    tr.consultorio,
    count(distinct tr.doctor_id) as doctores,
    count(distinct tr.trabajo_id) as trabajos,
    coalesce(sum(tr.precio_acordado), 0) as facturado,
    coalesce(sum(p.pagado), 0) as pagado,
    coalesce(sum(tr.precio_acordado), 0) - coalesce(sum(p.pagado), 0) as saldo
  from trabajos tr
  join pagos p on p.trabajo_id = tr.trabajo_id
  group by tr.consultorio_id, tr.consultorio
  order by saldo desc;
$$;

grant execute on function deuda_por_consultorio() to authenticated;
