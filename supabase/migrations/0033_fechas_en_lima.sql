-- Las fechas por defecto, en la hora de Lima.
--
-- El fallo, reportado y medido: un trabajo registrado a las 19:36 apareció con
-- la fecha del día siguiente. La causa es que `current_date` en PostgreSQL
-- devuelve la fecha **en UTC**, y Lima va cinco horas por detrás: desde las
-- 19:00 de Lima, la base ya cree que es mañana.
--
-- Se encontraron dos trabajos con la fecha corrida, los dos creados después de
-- las 19:00. En un laboratorio que registra trabajos hasta tarde, esto habría
-- ido ensuciando la producción de cada día —y con ella los reportes, la
-- pantalla Hoy y el conteo de entregas— sin que nada fallara a la vista.
--
-- Seis columnas tenían el mismo defecto. Se corrigen todas a la vez: dejar una
-- sola sin arreglar sería dejar el fallo vivo esperando a que alguien registre
-- un gasto o un pago de noche.

/*
  `now() at time zone 'America/Lima'` y no `current_date`.

  `now()` devuelve el instante con su zona; convertirlo a la de Lima y
  recortarlo a fecha da el día que el laboratorio está viviendo, que es el
  único que le sirve. La zona se nombra y no se escribe como `-05:00` para que
  siga siendo correcta si Perú adoptara horario de verano.
*/
alter table trabajo
  alter column fecha_ingreso set default (now() at time zone 'America/Lima')::date;

alter table abono
  alter column fecha set default (now() at time zone 'America/Lima')::date;

alter table movimiento_inventario
  alter column fecha set default (now() at time zone 'America/Lima')::date;

alter table pago_trabajador
  alter column fecha set default (now() at time zone 'America/Lima')::date;

alter table gasto
  alter column fecha set default (now() at time zone 'America/Lima')::date;

alter table cuota
  alter column emitida_el set default (now() at time zone 'America/Lima')::date;

/*
  Los dos trabajos que ya quedaron mal.

  Se corrigen comparando con `creado_en`, que es un `timestamptz` y por tanto
  guarda el instante exacto sin ambigüedad de zona. Solo se tocan las filas
  donde la fecha guardada **no** coincide con el día de Lima en que se crearon:
  una fecha de ingreso puede haberse editado a mano a propósito, y este arreglo
  no debe pisar esa decisión.
*/
update trabajo
set fecha_ingreso = (creado_en at time zone 'America/Lima')::date
where fecha_ingreso <> (creado_en at time zone 'America/Lima')::date
  -- Solo las corridas por este fallo: exactamente un día por delante.
  and fecha_ingreso = ((creado_en at time zone 'America/Lima')::date + 1);
