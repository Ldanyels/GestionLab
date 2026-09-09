-- Fecha real de entrega de un trabajo.
--
-- `trabajo.fecha_entrega` ya existía, pero es la fecha **prometida**: se llena
-- al crear el trabajo y en la práctica nadie la llena (en MasterLab está en
-- NULL en todos los trabajos, y por eso el filtro por fecha de la lista opera
-- sobre `fecha_ingreso`). Esta columna guarda cuándo salió de verdad, que es lo
-- que permite responder «qué entregamos esta semana».
--
-- El nombre es deliberadamente distinto y no `fecha_entrega_real`: leídas de
-- corrido en una consulta, dos columnas que empiezan igual se confunden.
--
-- Los trabajos ya entregados antes de esta migración se quedan en NULL a
-- propósito. Rellenarlos con `creado_en` o con la fecha de hoy inventaría un
-- dato de control que nadie registró.
alter table trabajo add column if not exists entregado_el date;

comment on column trabajo.entregado_el is
  'Fecha real de entrega. La sella el paso a estado entregado y el administrador puede corregirla. NULL en los trabajos no entregados.';

-- El filtro por periodo consulta esta columna acotando siempre por
-- laboratorio, así que el índice va compuesto y en ese orden.
create index if not exists trabajo_entregado_el_idx
  on trabajo (laboratorio_id, entregado_el);
