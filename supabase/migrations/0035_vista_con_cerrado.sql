-- La vista de listado, con `cerrado_el`.
--
-- Fallo encontrado en producción: la pantalla Hoy decía «Trabajos de hoy: 9» y
-- justo debajo «Todavía no hay movimientos hoy». Los nueve estaban ahí; lo que
-- fallaba era la consulta.
--
-- La migración 0034 añadió `cerrado_el` a la tabla `trabajo`, pero la vista se
-- había creado en la 0030 enumerando sus columnas una por una, así que no la
-- incluía. Pedirla devolvía `42703` y la aplicación se quedaba con una lista
-- vacía sin decir nada.
--
-- Lección que deja: una vista que enumera columnas hay que recrearla cada vez
-- que la tabla de abajo gana una que la vista necesita. `create or replace`
-- aquí es exactamente para eso.

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
  t.cerrado_el,
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

