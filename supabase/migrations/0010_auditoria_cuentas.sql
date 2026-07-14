-- ============================================================
-- GestionLab — Migración 0010: Auditoría + Estado de cuenta
-- ============================================================

-- ── Auditoría (historial de quién hizo qué) ────────────────
create table if not exists auditoria (
  id bigint generated always as identity primary key,
  laboratorio_id uuid,
  tabla text not null,
  registro_id uuid,
  accion text not null check (accion in ('INSERT','UPDATE','DELETE')),
  usuario_id uuid,
  usuario_nombre text,
  creado_en timestamptz not null default now()
);
create index if not exists idx_auditoria_lab on auditoria(laboratorio_id, creado_en desc);

alter table auditoria enable row level security;
drop policy if exists auditoria_read on auditoria;
create policy auditoria_read on auditoria
  for select using (laboratorio_id = laboratorio_actual());

create or replace function registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lab uuid;
  v_id uuid;
begin
  if (TG_OP = 'DELETE') then
    v_lab := OLD.laboratorio_id;
    v_id := OLD.id;
  else
    v_lab := NEW.laboratorio_id;
    v_id := NEW.id;
  end if;
  insert into auditoria(laboratorio_id, tabla, registro_id, accion, usuario_id, usuario_nombre)
  values (
    v_lab, TG_TABLE_NAME, v_id, TG_OP, auth.uid(),
    (select nombre from perfil where id = auth.uid())
  );
  return null;
end $$;

do $$
declare
  t text;
  tablas text[] := array[
    'trabajo','abono','pago_trabajador','movimiento_inventario',
    'catalogo_trabajo','consultorio','doctor','producto'
  ];
begin
  foreach t in array tablas loop
    execute format('drop trigger if exists aud_%1$s on %1$s', t);
    execute format(
      'create trigger aud_%1$s after insert or update or delete on %1$s for each row execute function registrar_auditoria()',
      t
    );
  end loop;
end $$;

-- ── Estado de cuenta por consultorio ───────────────────────
create or replace function estado_cuenta_consultorios()
returns table(consultorio text, facturado numeric, pagado numeric, saldo numeric)
language sql stable
as $$
  with t as (
    select c.id as cons_id, c.nombre, t.id as trab_id, t.precio_acordado
    from consultorio c
    join doctor d on d.consultorio_id = c.id
    join trabajo t on t.doctor_id = d.id
  ),
  fact as (
    select cons_id, nombre, sum(precio_acordado) as facturado
    from t group by cons_id, nombre
  ),
  pag as (
    select t.cons_id, sum(a.monto) as pagado
    from t join abono a on a.trabajo_id = t.trab_id
    group by t.cons_id
  )
  select f.nombre as consultorio,
         f.facturado::numeric,
         coalesce(p.pagado, 0)::numeric as pagado,
         (f.facturado - coalesce(p.pagado, 0))::numeric as saldo
  from fact f
  left join pag p on p.cons_id = f.cons_id
  order by (f.facturado - coalesce(p.pagado, 0)) desc;
$$;

grant execute on function estado_cuenta_consultorios() to authenticated;
