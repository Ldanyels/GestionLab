-- Registro de errores agrupados.
--
-- Hoy los errores van a la consola, que en Vercel queda en los logs de la
-- función: nadie los mira. El laboratorio intenta algo dos veces, se frustra y
-- avisa por WhatsApp al día siguiente. Esta tabla es para saberlo antes.
--
-- Una fila por **tipo** de error, no por ocurrencia. Un fallo que le pasa a
-- treinta laboratorios treinta veces es un problema, y guardarlo novecientas
-- veces solo serviría para enterrar los demás y para engordar la base sin
-- límite.
--
-- Como `cuota` y `aceptacion`: RLS activo y **ninguna política**. Es información
-- de operación del proveedor, y los mensajes de error de un laboratorio no
-- tienen por qué ser legibles por otro. Solo la clave de servicio llega aquí.

create table if not exists error_registrado (
  -- La huella la calcula la aplicación sobre el mensaje normalizado. Es la
  -- clave primaria porque es exactamente el criterio de agrupación.
  huella text primary key,
  donde text not null,
  -- El mensaje de la última ocurrencia, ya redactado. Se guarda el concreto y
  -- no el normalizado porque para depurar hace falta el valor real; agrupar ya
  -- lo hace la huella.
  mensaje text not null,
  codigo text,
  veces integer not null default 1,
  primera_vez timestamptz not null default now(),
  ultima_vez timestamptz not null default now(),
  -- Qué laboratorios lo sufrieron. Un arreglo y no una tabla aparte: son unas
  -- pocas decenas de laboratorios y lo único que se necesita saber es si le
  -- pasa a uno o a todos.
  laboratorios uuid[] not null default '{}',
  resuelto_el timestamptz,
  -- Cuándo se avisó por correo. Evita repetir el aviso del mismo tipo de error.
  avisado_el timestamptz
);

alter table error_registrado enable row level security;

-- Para la lista del panel: lo más reciente primero, sin recorrer la tabla.
create index if not exists error_registrado_ultima_vez_idx
  on error_registrado (ultima_vez desc);

/*
  Anotar en un solo viaje, sin carreras, y decidir de una vez si toca avisar.

  La alternativa —leer, decidir y escribir desde la aplicación— pierde cuentas
  cuando dos peticiones fallan a la vez, que es justo cuando algo se está
  rompiendo de verdad. El `on conflict` lo resuelve en la base.

  Si un error vuelve después de haberse marcado resuelto, se reabre: si sigue
  ocurriendo, no estaba arreglado.

  Devuelve si hay que mandar el aviso. La decisión se toma **aquí** y no en la
  aplicación porque dos peticiones que fallan en el mismo segundo tomarían la
  misma decisión por separado y mandarían dos correos del mismo problema. Se
  avisa cuando el error es nuevo, cuando reaparece tras haberse resuelto, y como
  mucho una vez al día mientras siga ocurriendo: un fallo que se repite mil veces
  en una tarde es un aviso, no mil.

  `avisado_el` se sella en el mismo momento en que se decide avisar, antes de que
  el correo salga. Si el envío falla, se pierde ese aviso. Es a propósito: es
  mejor perder un correo que inundar la bandeja cada vez que el envío falle y se
  reintente.
*/
create or replace function anotar_error(
  p_huella text,
  p_donde text,
  p_mensaje text,
  p_codigo text,
  p_laboratorio_id uuid
) returns boolean
language plpgsql
as $$
declare
  v_avisado timestamptz;
begin
  insert into error_registrado (huella, donde, mensaje, codigo, laboratorios, avisado_el)
  values (
    p_huella,
    p_donde,
    p_mensaje,
    p_codigo,
    case when p_laboratorio_id is null then '{}'::uuid[] else array[p_laboratorio_id] end,
    now()
  )
  on conflict (huella) do update set
    veces = error_registrado.veces + 1,
    ultima_vez = now(),
    mensaje = excluded.mensaje,
    codigo = excluded.codigo,
    resuelto_el = null,
    laboratorios = case
      when p_laboratorio_id is null then error_registrado.laboratorios
      when error_registrado.laboratorios @> array[p_laboratorio_id] then error_registrado.laboratorios
      else error_registrado.laboratorios || p_laboratorio_id
    end,
    avisado_el = case
      when error_registrado.resuelto_el is not null
        or error_registrado.avisado_el is null
        or error_registrado.avisado_el < now() - interval '24 hours'
      then now()
      else error_registrado.avisado_el
    end
  returning avisado_el into v_avisado;

  -- `now()` es el instante de la transacción y no cambia dentro de ella, así que
  -- esta igualdad distingue exactamente el caso en que se acaba de sellar.
  return v_avisado = now();
end
$$;

/*
  Nadie más que la clave de servicio.

  La función es `security invoker` a propósito: si un usuario de un laboratorio
  la llamara, escribiría con sus propios permisos y rebotaría contra el RLS sin
  políticas. Aun así se le quita el permiso de ejecución, para que no dependa de
  una sola línea de defensa.
*/
revoke execute on function anotar_error(text, text, text, text, uuid) from anon, authenticated;
