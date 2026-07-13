-- ============================================================
-- Semilla del catálogo de MasterLab (precios en S/).
-- Idempotente: no duplica si ya existe un trabajo con el mismo nombre.
-- Se aplica al laboratorio llamado 'MasterLab'.
-- ============================================================

insert into catalogo_trabajo
  (laboratorio_id, categoria, nombre, precio_base, variable_etiqueta, variable_precio_unitario)
select l.id, v.categoria, v.nombre, v.precio_base, v.variable_etiqueta, v.variable_precio_unitario
from laboratorio l
cross join (values
  -- Prótesis Fija
  ('Prótesis Fija', 'Perno colado (directo o indirecto)', 20, null, null),
  ('Prótesis Fija', 'Corona porcelana sobre metal (cerámico)', 90, null, null),
  ('Prótesis Fija', 'Corona porcelana veneer', 80, null, null),
  ('Prótesis Fija', 'Corona porcelana libre de metal (jacket)', 120, null, null),
  ('Prótesis Fija', 'Corona disilicato de litio', 150, null, null),
  ('Prótesis Fija', 'Corona porcelana sobre zirconio', 200, null, null),
  ('Prótesis Fija', 'Carilla porcelana feldespática', 100, null, null),
  ('Prótesis Fija', 'Carilla disilicato de litio', 150, null, null),
  ('Prótesis Fija', 'Incrustación de resina', 50, null, null),
  ('Prótesis Fija', 'Incrustación porcelana', 100, null, null),
  ('Prótesis Fija', 'Incrustación disilicato de litio', 150, null, null),
  ('Prótesis Fija', 'Provisionales acrílico', 20, null, null),
  -- Prótesis Total
  ('Prótesis Total', 'Totales acrílico', 120, null, null),
  ('Prótesis Total', 'Totales acrílico con malla', 130, null, null),
  ('Prótesis Total', 'Provisional de totales', 50, null, null),
  ('Prótesis Total', 'Prótesis telescópicas', 120, 'cofia', 20),
  ('Prótesis Total', 'Rebasados termocurado', 50, null, null),
  -- Prótesis Parcial Removible
  ('Prótesis Parcial Removible', 'Base metálica terminada', 200, null, null),
  ('Prótesis Parcial Removible', 'Prótesis flexibles', 200, null, null),
  ('Prótesis Parcial Removible', 'Prótesis combinada flex', 320, null, null),
  ('Prótesis Parcial Removible', 'Parcial acrílico + wipla', 120, null, null),
  ('Prótesis Parcial Removible', 'Parcial acrílico + ganchos colados', 150, null, null),
  -- Aparato Ortodoncia – Ortopedia
  ('Aparato Ortodoncia – Ortopedia', 'Placa de contención (el juego)', 120, null, null),
  ('Aparato Ortodoncia – Ortopedia', 'Placa de contención acetato rígido', 30, null, null),
  ('Aparato Ortodoncia – Ortopedia', 'Placa con tornillo de expansión', 80, null, null),
  ('Aparato Ortodoncia – Ortopedia', 'Hyrax', 120, null, null),
  ('Aparato Ortodoncia – Ortopedia', 'Placa miorelajante acrílico', 50, null, null),
  ('Aparato Ortodoncia – Ortopedia', 'Placa miorelajante acetato', 30, null, null),
  ('Aparato Ortodoncia – Ortopedia', 'ATP o ALP', 60, null, null)
) as v(categoria, nombre, precio_base, variable_etiqueta, variable_precio_unitario)
where l.nombre = 'MasterLab'
  and not exists (
    select 1 from catalogo_trabajo c
    where c.laboratorio_id = l.id and c.nombre = v.nombre
  );
