-- Registro de aceptación de los documentos legales.
--
-- Sustituye a la firma en papel. Lo que le da valor no es la casilla marcada,
-- sino poder demostrar **qué texto** aceptó esa persona: de ahí `version` y
-- `hash`, que vienen de sellar el documento con SHA-256. Sin la huella, el
-- registro dice «aceptó los términos» y no puede probar cuáles, porque el texto
-- pudo cambiar después.
--
-- No se guarda imagen del DNI a propósito. Para aceptar unos términos el número
-- alcanza, y almacenar el documento sería recoger más datos de los necesarios
-- —contra el principio de proporcionalidad de la Ley 29733— y convertiría este
-- sistema en custodio de documentos de identidad, un blanco bastante más
-- valioso que unos registros de trabajos dentales.
create table if not exists aceptacion (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,
  -- No lleva llave foránea a `perfil`: si ese usuario se borra, la aceptación
  -- debe sobrevivir. Es la prueba de que el laboratorio se comprometió, y no
  -- puede desaparecer porque la persona que la hizo ya no trabaje ahí.
  usuario_id uuid not null,
  usuario_correo text not null,

  documento text not null check (documento in ('terminos', 'privacidad', 'encargo')),
  version text not null,
  hash text not null,

  -- Datos que teclea quien acepta, para identificarlo.
  nombre_completo text not null,
  dni text not null,
  cargo text,

  -- Contexto de la aceptación. Suma credibilidad al registro.
  ip text,
  agente text,
  -- Trazo de la firma dibujada, si la hizo. Es un añadido ritual: refuerza el
  -- compromiso de quien firma, pero por sí solo no identifica a nadie y no se
  -- le atribuye valor probatorio.
  firma_svg text,

  creado_en timestamptz not null default now()
);

create index if not exists idx_aceptacion_lab on aceptacion (laboratorio_id, documento);

-- RLS activo y **sin ninguna política**: nadie llega a esta tabla con la clave
-- pública. Se lee y se escribe solo desde el servidor con la clave de servicio,
-- acotando por laboratorio en el código.
--
-- Es deliberado: una política de inserción mal escrita en una tabla de pruebas
-- de consentimiento permitiría fabricar aceptaciones ajenas, y ese es
-- exactamente el error que cerró la migración 0018. Sin política, no hay
-- política que equivocarse.
alter table aceptacion enable row level security;

comment on table aceptacion is
  'Aceptación de los documentos legales por parte de un laboratorio. Sustituye la firma en papel: la huella del documento permite demostrar qué texto se aceptó.';
