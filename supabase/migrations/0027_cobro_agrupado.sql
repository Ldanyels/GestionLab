-- Agrupar los abonos que vienen de un mismo pago.
--
-- El caso real: un consultorio yapea S/200 a cuenta de varios trabajos. Arte
-- oral debe S/1.960 repartidos en 12 trabajos, y hasta ahora registrar ese pago
-- exigía abrir trabajo por trabajo y decidir a mano cuánto va a cada uno. Por
-- eso hay 4 abonos registrados y S/9.260 sin cobrar en los papeles del sistema.
--
-- Un pago produce **varios** abonos, uno por trabajo. Sin agruparlos, un pago
-- registrado por error se deshace borrando abono por abono: con Arte oral,
-- doce borrados. Y ya pasó que se registren pagos equivocados —fue el motivo
-- por el que los abonos tuvieron que volverse editables.

alter table abono
  -- Nullable: los abonos registrados uno a uno desde la ficha del trabajo no
  -- pertenecen a ningún pago agrupado, y son la mayoría.
  add column if not exists cobro_id uuid;

-- Para deshacer un pago completo y para listar sus abonos. Parcial: la mayoría
-- de los abonos no tienen grupo y no hay por qué indexarlos.
create index if not exists abono_cobro_idx
  on abono (laboratorio_id, cobro_id)
  where cobro_id is not null;
