-- ============================================================
-- GestionLab — Migración 0013: pieza(s) dental(es) por trabajo
-- ============================================================

alter table trabajo add column if not exists pieza text;
