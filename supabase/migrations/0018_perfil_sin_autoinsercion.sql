-- ============================================================
-- GestionLab — Migración 0018: cerrar la autoinserción de perfil
--
-- PROBLEMA (crítico, aislamiento entre inquilinos)
-- La política `perfil_self_insert`, creada en 0001_fundacion.sql, era:
--
--   create policy perfil_self_insert on perfil
--     for insert with check (id = auth.uid());
--
-- El `with check` validaba SOLO la columna `id`. No validaba `laboratorio_id`
-- ni `rol`. Cualquier usuario autenticado que no tuviera todavía una fila en
-- `perfil` podía insertarse un perfil apuntando a CUALQUIER `laboratorio_id`
-- y con `rol = 'admin'`, y a partir de ahí `laboratorio_actual()` devolvía ese
-- laboratorio: lectura y escritura completas sobre los datos de otro inquilino,
-- incluidos nombres de pacientes.
--
-- SOLUCIÓN
-- Eliminar la política. Nadie necesita insertar su propio perfil: los perfiles
-- se crean siempre con la clave de servicio desde `lib/usuarios/data.ts`
-- (`crearUsuario`), que sí fija el `laboratorio_id` del administrador que
-- invita y valida el rol. La clave de servicio omite RLS por diseño, así que
-- al quitar esta política no se rompe ningún flujo existente.
--
-- Sin política de INSERT, `perfil` queda cerrado a los clientes: es el estado
-- correcto para una tabla que solo el servidor debe escribir.
-- ============================================================

drop policy if exists perfil_self_insert on perfil;

-- Verificación: `perfil` debe quedar sin ninguna política de INSERT.
-- Si esta consulta devuelve filas, la migración no logró su objetivo.
do $$
declare
  sobrantes int;
begin
  select count(*) into sobrantes
  from pg_policies
  where schemaname = 'public'
    and tablename = 'perfil'
    and cmd = 'INSERT';

  if sobrantes > 0 then
    raise exception
      'perfil sigue teniendo % política(s) de INSERT; revisar antes de continuar',
      sobrantes;
  end if;
end $$;
