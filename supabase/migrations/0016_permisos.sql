-- ============================================================
-- GestionLab — Migración 0016: Permisos por usuario
-- El rol sigue mandando (admin = todo). Los permisos amplían
-- lo que puede ver o hacer un técnico, uno por uno.
-- ============================================================

alter table perfil
  add column if not exists permisos text[] not null default '{}';

comment on column perfil.permisos is
  'Permisos extra del técnico: reportes, inventario_ver, inventario_editar. El admin los tiene todos implícitamente.';
