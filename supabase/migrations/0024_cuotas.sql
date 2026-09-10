-- Registro de cuotas: qué se le cobró a cada laboratorio y qué pagó.
--
-- El sistema sabía si un laboratorio estaba activo o suspendido y si su plan
-- era gratis o pagado, pero no qué meses había pagado. Con dos clientes eso se
-- recuerda; con ocho se convierte en una hoja de cálculo aparte y en cobrarle
-- dos veces a alguien.
--
-- Esto va ANTES de automatizar el cobro con una pasarela: la pasarela
-- automatiza el cobro, pero el registro de qué se cobró sigue siendo necesario.
-- Al revés habría que rehacerlo.

-- ── Condiciones de cobro de cada laboratorio ─────────────────
alter table laboratorio add column if not exists periodicidad text
  check (periodicidad is null or periodicidad in ('mensual', 'anual'));
alter table laboratorio add column if not exists precio_cuota numeric(10,2)
  check (precio_cuota is null or precio_cuota >= 0);
-- Desde cuándo se le cobra. NULL = cortesía o todavía sin definir, y entonces
-- no se le genera ninguna cuota.
alter table laboratorio add column if not exists inicio_cobro date;

-- ── Las cuotas ───────────────────────────────────────────────
create table if not exists cuota (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references laboratorio(id) on delete cascade,

  -- El periodo que cubre, anclado al día de inicio de cobro: si se empieza a
  -- cobrar un 15, el periodo va del 15 al 14 del mes siguiente. Sin meses
  -- partidos ni prorrateos.
  periodo_inicio date not null,
  periodo_fin date not null,

  emitida_el date not null default current_date,
  vence_el date not null,
  monto numeric(10,2) not null check (monto >= 0),

  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'pagada', 'anulada')),

  -- Se llenan al marcarla pagada.
  pagada_el date,
  medio_pago text,
  comprobante text,
  nota text,

  creado_en timestamptz not null default now()
);

/*
  El índice único es lo que hace segura la generación de cuotas al abrir el
  panel: si la pantalla se renderiza dos veces, la segunda inserción rebota en
  la base en vez de duplicar la cuota. Sin él, esa idea sería una fábrica de
  cobros repetidos.
*/
create unique index if not exists cuota_periodo_unico
  on cuota (laboratorio_id, periodo_inicio);

create index if not exists idx_cuota_estado on cuota (estado, vence_el);

-- RLS activo y sin ninguna política: esto es contabilidad del proveedor, no
-- datos del inquilino. Nadie llega desde la aplicación del laboratorio.
alter table cuota enable row level security;

comment on table cuota is
  'Cuotas de suscripción emitidas a cada laboratorio. Contabilidad del proveedor: no se expone a los inquilinos.';
