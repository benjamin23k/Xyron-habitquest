-- XYRON — Fase 8: Seasons (solo arquitectura, sin UI todavía)
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0010_journal_and_notifications.sql. No borra ni toca ninguna fila
-- existente — solo agrega una tabla nueva, sin ningún efecto sobre el resto
-- del sistema (nada la lee ni la escribe todavía).
--
-- Contexto: el spec pide dejar la arquitectura preparada para temporadas
-- (ej. "Season 1: Enero-Marzo") sin construir todavía el sistema social/UI
-- que las consuma. Por eso esta tabla es puro catálogo de solo lectura desde
-- el cliente — igual que achievements/titles — y no se le da ningún GRANT de
-- insert/update a "authenticated": se va a poblar manualmente (o desde un
-- futuro panel admin) hasta que exista una fase que la use de verdad.

create table public.seasons (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    theme text,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    is_active boolean not null default false,
    created_at timestamptz not null default now(),
    constraint seasons_valid_range check (ends_at > starts_at)
);

-- A lo sumo una temporada activa a la vez (índice único parcial).
create unique index seasons_one_active_idx on public.seasons ((is_active)) where is_active;

create index seasons_starts_at_idx on public.seasons (starts_at);

alter table public.seasons enable row level security;

revoke all on public.seasons from anon, authenticated;

grant select on public.seasons to authenticated;

create policy "seasons_select_all"
    on public.seasons for select
    using (true);
