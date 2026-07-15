-- ============================================================
-- GestionLab — Migración 0012: eliminar definitivo de tipo de trabajo
-- Permite borrar un tipo del catálogo y, en cascada, sus trabajos.
-- (Productos ya cascadean movimientos y recetas; no requieren cambio.)
-- ============================================================

alter table trabajo drop constraint if exists trabajo_catalogo_trabajo_id_fkey;
alter table trabajo
  add constraint trabajo_catalogo_trabajo_id_fkey
  foreign key (catalogo_trabajo_id) references catalogo_trabajo(id) on delete cascade;
