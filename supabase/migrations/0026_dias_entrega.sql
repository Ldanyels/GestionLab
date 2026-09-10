-- Plazo de entrega por tipo de trabajo.
--
-- En el piloto, 46 de 47 trabajos no tenían fecha de entrega. No porque no
-- importe —es el dato más importante de un laboratorio— sino porque el
-- formulario pedía una fecha de calendario, y un laboratorio no piensa en
-- fechas: piensa en días. «Acrílico, tres días.»
--
-- Con el plazo en el catálogo, la fecha de entrega se calcula sola al elegir el
-- tipo de trabajo, y el laboratorio solo la ajusta cuando hace falta.

alter table catalogo_trabajo
  -- Nullable a propósito: null es «este tipo no tiene plazo definido» y no
  -- sugiere ninguna fecha. Un default de, digamos, 3 días le pondría a todo el
  -- catálogo existente un plazo que nadie prometió.
  add column if not exists dias_entrega integer;

-- 0 días es válido (un ajuste que se entrega el mismo día); un año ya es un
-- error de tecleo. El límite vive en la base además del formulario porque las
-- Server Actions se pueden invocar directamente.
alter table catalogo_trabajo
  drop constraint if exists catalogo_trabajo_dias_entrega_check;
alter table catalogo_trabajo
  add constraint catalogo_trabajo_dias_entrega_check
  check (dias_entrega is null or (dias_entrega >= 0 and dias_entrega <= 365));

/*
  Índice para la pantalla Hoy y el aviso de atrasadas.

  Parcial: solo las filas que tienen fecha y aún no se entregaron, que son las
  únicas que esas consultas miran. Un índice completo ocuparía espacio
  indexando los miles de trabajos ya entregados que nunca se van a consultar
  por su fecha de entrega.
*/
create index if not exists trabajo_entrega_pendiente_idx
  on trabajo (laboratorio_id, fecha_entrega)
  where fecha_entrega is not null and estado not in ('entregado', 'cerrado');
