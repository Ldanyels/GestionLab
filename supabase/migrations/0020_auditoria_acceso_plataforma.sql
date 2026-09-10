-- Atribución de la plataforma en el historial de auditoría.
--
-- El disparador `registrar_auditoria()` (migración 0010) guarda `auth.uid()` y
-- busca el nombre en `perfil`. Con la clave de servicio, `auth.uid()` es NULL y
-- no hay perfil, así que todo lo que hace el panel quedaría registrado como si
-- no lo hubiera hecho nadie.
--
-- La columna es aparte y no reutiliza `usuario_nombre` porque son preguntas
-- distintas: `usuario_nombre` responde «qué usuario del laboratorio hizo esto»,
-- y aquí la respuesta correcta es «ninguno». Un laboratorio que revise su
-- historial debe poder distinguir un cambio suyo de uno del proveedor.
alter table auditoria add column if not exists actor_plataforma text;

comment on column auditoria.actor_plataforma is
  'Correo del operador de la plataforma que provocó el registro. NULL cuando lo hizo un usuario del propio laboratorio.';

-- 'ACCESO' no es un cambio de datos y por eso no lo contemplaba la restricción
-- original: registra que alguien de la plataforma abrió la ficha del
-- laboratorio. Una restricción CHECK no se amplía, hay que recrearla. El nombre
-- está verificado contra producción (2026-09-09): insertar una fila con
-- accion='ACCESO' responde 23514 nombrando `auditoria_accion_check`.
alter table auditoria drop constraint if exists auditoria_accion_check;
alter table auditoria add constraint auditoria_accion_check
  check (accion in ('INSERT','UPDATE','DELETE','ACCESO'));
