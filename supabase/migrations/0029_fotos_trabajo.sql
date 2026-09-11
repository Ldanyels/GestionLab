-- Fotografías del trabajo: cómo llega y cómo se entrega.
--
-- El consultorio manda una pieza en cierto estado, el laboratorio trabaja sobre
-- ella y la devuelve en otro. Cuando hay discrepancia, hoy no existe forma de
-- demostrar nada. Dos fotos al recibir y dos al entregar resuelven esa
-- conversación antes de que empiece.
--
-- **Estas imágenes son datos sensibles.** Van asociadas a un paciente y a un
-- trabajo dental, así que bajo la Ley N° 29733 reciben el mismo trato que el
-- nombre del paciente. De ahí tres decisiones que no son negociables: el bucket
-- es privado, el acceso se controla en `storage.objects` y no solo en la
-- aplicación, y las fotos se borran a los 6 meses.

create table if not exists foto_trabajo (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  trabajo_id uuid not null references trabajo(id) on delete cascade,
  -- En qué momento se tomó. Son los dos extremos de la conversación con el
  -- consultorio: en qué estado llegó y en qué estado salió.
  momento text not null check (momento in ('recepcion', 'entrega')),
  /*
    Posición de la foto dentro de su momento: 1 o 2.

    El límite de dos por momento vive aquí, en la clave única de abajo, y no en
    un contador que la aplicación consulte antes de insertar. Un contador tiene
    una carrera —dos subidas simultáneas leen «1» y las dos escriben— y el
    resultado serían tres fotos donde el contrato dice dos.
  */
  orden smallint not null check (orden in (1, 2)),
  -- Ruta dentro del bucket. Empieza por el id del laboratorio, y de ahí lo
  -- deducen las políticas de `storage.objects`.
  ruta text not null,
  creado_en timestamptz not null default now()
);

create unique index if not exists foto_trabajo_unica
  on foto_trabajo (trabajo_id, momento, orden);
create index if not exists idx_foto_trabajo_lab on foto_trabajo (laboratorio_id);
-- Para el borrado a los 6 meses: encuentra las vencidas sin recorrer la tabla.
create index if not exists idx_foto_trabajo_edad on foto_trabajo (creado_en);

alter table foto_trabajo enable row level security;

drop policy if exists foto_trabajo_rw on foto_trabajo;
create policy foto_trabajo_rw on foto_trabajo for all
  using (laboratorio_id = laboratorio_actual())
  with check (laboratorio_id = laboratorio_actual());

/*
  El bucket, privado.

  `public = false` es la línea más importante de este archivo. Un bucket público
  sirve cualquier archivo a quien adivine su URL, sin sesión y sin registro: sería
  publicar fotografías de trabajos dentales de pacientes en internet abierto.
*/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trabajos',
  'trabajos',
  false,
  -- 2 MB por archivo. La aplicación comprime a ~300 KB antes de subir; este
  -- tope es la red por si esa compresión falla o alguien llama a la API
  -- directamente, no el tamaño esperado.
  2097152,
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

/*
  Aislamiento en el propio almacenamiento.

  Las rutas son `{laboratorio_id}/{trabajo_id}/{archivo}`, así que la primera
  carpeta dice de quién es el archivo. Comprobarlo aquí y no solo en la
  aplicación es lo que hace que un laboratorio no pueda leer las fotos de otro
  ni llamando a la API de Supabase con su propia sesión.
*/
drop policy if exists fotos_trabajo_leer on storage.objects;
create policy fotos_trabajo_leer on storage.objects for select
  using (
    bucket_id = 'trabajos'
    and (storage.foldername(name))[1] = laboratorio_actual()::text
  );

drop policy if exists fotos_trabajo_subir on storage.objects;
create policy fotos_trabajo_subir on storage.objects for insert
  with check (
    bucket_id = 'trabajos'
    and (storage.foldername(name))[1] = laboratorio_actual()::text
  );

drop policy if exists fotos_trabajo_borrar on storage.objects;
create policy fotos_trabajo_borrar on storage.objects for delete
  using (
    bucket_id = 'trabajos'
    and (storage.foldername(name))[1] = laboratorio_actual()::text
  );
