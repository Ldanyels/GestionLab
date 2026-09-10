-- Qué se hizo, no solo sobre qué tabla.
--
-- `auditoria` guarda tabla, registro y acción, y eso alcanza para los cambios
-- que hace un usuario del laboratorio desde su propia pantalla: el contexto lo
-- da la pantalla. Pero cuando el cambio viene de la plataforma, «UPDATE sobre
-- perfil» no distingue un restablecimiento de contraseña de un cambio de
-- nombre, y quien revise su historial no puede saber qué le pasó a su cuenta.
--
-- Se llena solo en los cambios hechos desde el panel de plataforma. Los
-- disparadores de la migración 0010 la dejan en NULL, y está bien: ahí la
-- pregunta «qué se hizo» ya la responde la pantalla desde la que se hizo.
alter table auditoria add column if not exists detalle text;

comment on column auditoria.detalle is
  'Descripción en español de lo que se hizo, para los cambios originados en el panel de plataforma. NULL en los que registran los disparadores.';
