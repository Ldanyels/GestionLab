-- Los números de la pantalla Hoy, calculados en la base.
--
-- Hoy es la pantalla que se abre cada mañana, y hasta ahora descargaba **todos**
-- los trabajos del laboratorio para contar cuatro cosas y sumar una. A 18
-- trabajos diarios eso llega a 6.570 filas en un año: megabytes viajando al
-- teléfono para mostrar cinco cifras.
--
-- Esta función devuelve **una sola fila** con las cinco. El trabajo lo hace el
-- servidor de base de datos, que ya tiene los datos delante.

/*
  Sin `security definer`, como `deuda_por_consultorio`.

  Al ejecutarse con los permisos de quien llama, el `from trabajo` de abajo pasa
  por las políticas de RLS y solo ve el laboratorio de la sesión. Marcarla
  `security definer` la haría contar los trabajos de todos los laboratorios en
  un solo número, que es una fuga que ningún filtro de la aplicación podría
  corregir.
*/
create or replace function resumen_hoy(p_hoy date)
returns table(
  ingresados_hoy bigint,
  entregas_hoy bigint,
  en_curso bigint,
  atrasadas bigint,
  por_cobrar numeric
)
language sql
stable
as $$
  with saldos as (
    select
      t.estado,
      t.fecha_ingreso,
      t.fecha_entrega,
      t.precio_acordado - coalesce(
        (select sum(a.monto) from abono a where a.trabajo_id = t.id), 0
      ) as saldo
    from trabajo t
  )
  select
    count(*) filter (where fecha_ingreso = p_hoy),
    count(*) filter (where fecha_entrega = p_hoy),
    count(*) filter (where estado = 'en_curso'),
    /*
      Atrasadas: prometidas, ya vencidas y aún sin entregar.

      Es la misma regla que `estadoDeEntrega` aplica en la aplicación. Lo
      cerrado o entregado no cuenta aunque su fecha haya pasado: si contara,
      todos los trabajos viejos aparecerían en rojo el día que se les ponga
      fecha y el aviso dejaría de significar nada.
    */
    count(*) filter (
      where fecha_entrega is not null
        and fecha_entrega < p_hoy
        and estado not in ('entregado', 'cerrado')
    ),
    /*
      Solo los saldos positivos, uno por uno.

      `greatest(saldo, 0)` y no la suma directa: un pago en exceso sobre un
      trabajo no cancela la deuda de otro. Es la misma regla que aplicaba
      `resumenHoy` en memoria.
    */
    coalesce(sum(greatest(saldo, 0)), 0)
  from saldos;
$$;
