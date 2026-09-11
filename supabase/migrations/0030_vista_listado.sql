-- Vista para listar y contar trabajos sin traérselos todos.
--
-- El problema medido: la lista de trabajos descarga cada fila con sus joins,
-- 0,97 KB por trabajo. MasterLab lleva 18 trabajos al día —6.570 al año— así
-- que en doce meses serían **5,7 MB cada vez que alguien abre la pantalla**, y
-- eso viaja al teléfono de un técnico con el wifi del taller.
--
-- Se traía todo porque dos de los cuatro filtros no son columnas: el saldo se
-- calcula restando los abonos, y la búsqueda cruza tipo, paciente, doctor y
-- consultorio. Esta vista los convierte en columnas, y con eso la base puede
-- filtrar, contar y devolver solo la página que se ve.

/*
  `security_invoker = on` es la línea crítica.

  Sin ella, una vista se ejecuta con los permisos de quien la creó —el
  superusuario— y **el RLS de las tablas de abajo no se aplica**: cualquier
  laboratorio vería los trabajos de todos. Con `security_invoker`, la vista
  corre con los permisos de quien consulta y hereda las políticas existentes.
*/
create or replace view trabajo_listado
with (security_invoker = on) as
select
  t.id,
  t.laboratorio_id,
  t.doctor_id,
  t.catalogo_trabajo_id,
  t.paciente_nombre,
  t.pieza,
  t.fecha_ingreso,
  t.fecha_entrega,
  t.entregado_el,
  t.estado,
  t.precio_acordado,
  t.cantidad,
  t.variable_cantidad,
  t.notas,
  t.creado_en,
  d.nombre as doctor_nombre,
  c.id as consultorio_id,
  c.nombre as consultorio_nombre,
  coalesce(pg.total_pagado, 0)::numeric(12, 2) as total_pagado,
  round(t.precio_acordado - coalesce(pg.total_pagado, 0), 2) as saldo,
  /*
    Un solo campo de texto para buscar, ya en minúsculas y sin tildes.

    `translate` en vez de la extensión `unaccent` para no depender de que esté
    instalada, y sin tildes porque quien tiene prisa escribe «munoz». Es la
    misma regla que aplica el buscador de doctores en la aplicación.
  */
  lower(
    translate(
      concat_ws(
        ' ',
        coalesce(tp.tipos, cat.nombre),
        t.paciente_nombre,
        d.nombre,
        c.nombre
      ),
      'áéíóúüñÁÉÍÓÚÜÑ',
      'aeiouunAEIOUUN'
    )
  ) as busqueda
from trabajo t
left join doctor d on d.id = t.doctor_id
left join consultorio c on c.id = d.consultorio_id
left join catalogo_trabajo cat on cat.id = t.catalogo_trabajo_id
-- Los abonos agregados por trabajo: es el cálculo del saldo, que antes se hacía
-- en memoria sumando el arreglo de abonos de cada fila.
left join lateral (
  select sum(a.monto) as total_pagado
  from abono a
  where a.trabajo_id = t.id
) pg on true
-- Los nombres de los tipos de las líneas, solo para poder buscarlos. El texto
-- que se **muestra** («2× Corona + 1× Perno») lo sigue armando la aplicación:
-- duplicar ese formato aquí crearía dos versiones que se separarían con el
-- tiempo.
left join lateral (
  select string_agg(ct.nombre, ' ') as tipos
  from trabajo_item ti
  join catalogo_trabajo ct on ct.id = ti.catalogo_trabajo_id
  where ti.trabajo_id = t.id
) tp on true;

-- Índices que la vista aprovecha al filtrar y ordenar. Sobre las tablas base,
-- que es donde el planificador los busca.
create index if not exists idx_trabajo_lab_ingreso
  on trabajo (laboratorio_id, fecha_ingreso desc);
create index if not exists idx_trabajo_lab_estado
  on trabajo (laboratorio_id, estado);
create index if not exists idx_abono_trabajo on abono (trabajo_id);
