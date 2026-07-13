-- ============================================================
-- GestionLab — Migración 0001: Fundación multi-inquilino
-- Tablas: laboratorio, perfil. Función: laboratorio_actual().
-- Seguridad: Row Level Security por laboratorio.
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Inquilinos (laboratorios) ──────────────────────────────
create table if not exists laboratorio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  plan text not null default 'gratis' check (plan in ('gratis','pagado')),
  estado text not null default 'activo' check (estado in ('activo','suspendido')),
  creado_en timestamptz not null default now()
);

-- ── Perfil de usuario (ligado a auth.users) ────────────────
create table if not exists perfil (
  id uuid primary key references auth.users(id) on delete cascade,
  laboratorio_id uuid not null references laboratorio(id) on delete restrict,
  nombre text not null,
  rol text not null default 'tecnico' check (rol in ('admin','tecnico')),
  creado_en timestamptz not null default now()
);

create index if not exists idx_perfil_laboratorio on perfil(laboratorio_id);

-- ── Laboratorio del usuario autenticado ────────────────────
-- Usada por TODAS las políticas RLS de las demás tablas.
create or replace function laboratorio_actual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select laboratorio_id from perfil where id = auth.uid()
$$;

-- ── Row Level Security ─────────────────────────────────────
alter table laboratorio enable row level security;
alter table perfil enable row level security;

drop policy if exists laboratorio_propio on laboratorio;
create policy laboratorio_propio on laboratorio
  for select using (id = laboratorio_actual());

drop policy if exists perfil_propio_lab on perfil;
create policy perfil_propio_lab on perfil
  for select using (laboratorio_id = laboratorio_actual());

drop policy if exists perfil_self_insert on perfil;
create policy perfil_self_insert on perfil
  for insert with check (id = auth.uid());
