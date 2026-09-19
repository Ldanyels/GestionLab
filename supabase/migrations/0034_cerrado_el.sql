-- Cuándo se cerró un trabajo.
--
-- La pantalla Hoy debe mostrar **todo lo que pasó hoy**, no solo lo que ingresó
-- hoy: un trabajo que entró la semana pasada y se terminó esta mañana es
-- producción de hoy y hasta ahora no aparecía en ninguna parte.
--
-- De los cuatro movimientos, tres ya dejaban rastro con fecha —el ingreso en
-- `fecha_ingreso`, la entrega en `entregado_el` (migración 0019) y el cobro en
-- `abono.fecha`—. El cierre no dejaba ninguno: cambiaba el estado y nada más.
--
-- La auditoría no servía como sustituto: guarda 253 filas de «UPDATE trabajo»
-- sin detalle, así que no distingue un cierre de una corrección de precio.

alter table trabajo
  -- Nullable: solo lo llevan los que se cerraron, y se vacía si el trabajo se
  -- reabre, igual que hace `entregado_el`.
  add column if not exists cerrado_el date;

-- Para la pantalla Hoy, que pregunta por un día concreto. Parcial: solo las
-- filas que tienen fecha, que son las únicas que esa consulta mira.
create index if not exists idx_trabajo_cerrado_el
  on trabajo (laboratorio_id, cerrado_el)
  where cerrado_el is not null;

/*
  Los cierres que ya ocurrieron no se pueden reconstruir.

  La fecha del cierre no se guardaba en ninguna parte, y la auditoría solo dice
  que hubo un «UPDATE» sin decir cuál. Se deja en NULL a propósito en vez de
  inventar una a partir de `creado_en` o de la fecha de ingreso: una fecha
  aproximada en una pantalla de producción diaria es peor que un hueco, porque
  nadie sabría cuáles son ciertas.
*/
