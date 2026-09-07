-- ============================================================
-- GestionLab — Migración 0014: Orden del catálogo + cantidad de piezas
-- ============================================================

-- Orden configurable de los tipos de trabajo (dentro de su categoría).
alter table catalogo_trabajo
  add column if not exists orden int not null default 0;

-- Inicializa el orden con el orden alfabético actual (solo filas sin orden).
update catalogo_trabajo c
set orden = sub.rn
from (
  select id,
         row_number() over (
           partition by laboratorio_id, categoria
           order by nombre
         ) as rn
  from catalogo_trabajo
) sub
where c.id = sub.id
  and c.orden = 0;

create index if not exists idx_catalogo_orden
  on catalogo_trabajo(laboratorio_id, categoria, orden);

-- Cantidad de piezas por trabajo (mismo tipo repetido para varios dientes).
alter table trabajo
  add column if not exists cantidad int not null default 1 check (cantidad >= 1);
