-- Métricas de los laboratorios para el panel del proveedor.
--
-- Responden a una pregunta concreta del negocio: ¿sigue siendo rentable cobrar
-- S/250 por laboratorio? Medido, un laboratorio como MasterLab consume 2 GB de
-- fotos y 1 GB de descarga al mes; caben 51 en el plan de $45. Así que el
-- consumo **no** es la variable a vigilar.
--
-- Lo que sí decide el ingreso es si el laboratorio **sigue usando el sistema**:
-- eso se ve semanas antes en la actividad que en una cuota impagada, y cuando
-- llega la cuota impagada ya se perdió al cliente.
--
-- Una sola función y no una consulta por laboratorio: con veinte clientes,
-- preguntar cinco cosas a cada uno serían cien viajes a la base para pintar una
-- pantalla.

/*
  `security invoker` (el predeterminado), como el resto de funciones del
  sistema.

  El panel la llama con la clave de servicio, que ve todos los laboratorios. Si
  la llamara un usuario de un laboratorio, el RLS lo dejaría con su propia fila
  y nada más. Marcarla `security definer` expondría las métricas de todos los
  clientes a cualquiera que supiera el nombre de la función.
*/
create or replace function metricas_laboratorios(
  p_desde_7 date,
  p_desde_14 date,
  p_desde_mes date
)
returns table(
  laboratorio_id uuid,
  trabajos_7 bigint,
  trabajos_previos_7 bigint,
  trabajos_mes bigint,
  trabajos_total bigint,
  ultimo_trabajo date,
  fotos bigint,
  accesos_soporte bigint
)
language sql
stable
as $$
  select
    l.id,
    coalesce(t.en_7, 0),
    coalesce(t.previos_7, 0),
    coalesce(t.en_mes, 0),
    coalesce(t.total, 0),
    t.ultimo,
    coalesce(f.n, 0),
    coalesce(a.n, 0)
  from laboratorio l
  left join lateral (
    select
      count(*) filter (where fecha_ingreso >= p_desde_7) as en_7,
      -- La ventana anterior es [14 días, 7 días): sin el límite superior se
      -- solaparía con la actual y la comparación no diría nada.
      count(*) filter (where fecha_ingreso >= p_desde_14 and fecha_ingreso < p_desde_7)
        as previos_7,
      count(*) filter (where fecha_ingreso >= p_desde_mes) as en_mes,
      count(*) as total,
      max(fecha_ingreso) as ultimo
    from trabajo
    where laboratorio_id = l.id
  ) t on true
  left join lateral (
    select count(*) as n from foto_trabajo where laboratorio_id = l.id
  ) f on true
  left join lateral (
    -- Accesos del proveedor a ese laboratorio: es el soporte que ha costado.
    select count(*) as n
    from auditoria
    where laboratorio_id = l.id and accion = 'ACCESO'
  ) a on true;
$$;
