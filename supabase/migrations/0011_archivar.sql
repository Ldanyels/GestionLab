-- ============================================================
-- GestionLab — Migración 0011: Archivar consultorios/doctores + borrado en cascada
-- ============================================================

alter table consultorio add column if not exists activo boolean not null default true;
alter table doctor add column if not exists activo boolean not null default true;

-- "Eliminar definitivo": al borrar un doctor, borrar también sus trabajos
-- (antes estaba en 'restrict', por eso no se podía eliminar un consultorio con trabajos).
alter table trabajo drop constraint if exists trabajo_doctor_id_fkey;
alter table trabajo
  add constraint trabajo_doctor_id_fkey
  foreign key (doctor_id) references doctor(id) on delete cascade;
