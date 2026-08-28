-- XYRON — Fase 7: Journal + Notifications
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0009_pomodoro.sql. No borra ni toca ninguna fila existente — solo agrega
-- dos tablas nuevas.
--
-- Contexto: a diferencia de misiones/pomodoro/skills, ninguna de las dos
-- tablas de esta fase otorga XP, monedas ni ningún otro valor económico —
-- son puro registro personal (journal) y log de lo que ya pasó (notifications,
-- espejo persistente de los toasts que ya se disparan desde acciones
-- validadas por RPC). Por eso no hace falta una función SECURITY DEFINER acá:
-- alcanza con RLS estándar (cada usuario solo puede tocar sus propias filas).

-- =========================================================
-- 1. JOURNAL_ENTRIES
-- =========================================================

create table public.journal_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    mood text check (mood in ('great', 'good', 'okay', 'bad', 'terrible')),
    reflection text,
    wins text,
    problems text,
    goals text,
    entry_date date not null,
    created_at timestamptz not null default now()
);

create index journal_entries_user_created_idx on public.journal_entries (user_id, created_at desc);

alter table public.journal_entries enable row level security;

revoke all on public.journal_entries from anon, authenticated;

grant select, insert, delete on public.journal_entries to authenticated;
grant update (mood, reflection, wins, problems, goals) on public.journal_entries to authenticated;

create policy "journal_entries_select_own"
    on public.journal_entries for select
    using (user_id = auth.uid());

create policy "journal_entries_insert_own"
    on public.journal_entries for insert
    with check (user_id = auth.uid());

create policy "journal_entries_update_own"
    on public.journal_entries for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "journal_entries_delete_own"
    on public.journal_entries for delete
    using (user_id = auth.uid());

-- =========================================================
-- 2. NOTIFICATIONS — espejo persistente de los toasts
-- =========================================================

create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    kind text not null,
    title text not null,
    body text,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

revoke all on public.notifications from anon, authenticated;

grant select, insert on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

create policy "notifications_select_own"
    on public.notifications for select
    using (user_id = auth.uid());

create policy "notifications_insert_own"
    on public.notifications for insert
    with check (user_id = auth.uid());

create policy "notifications_update_own"
    on public.notifications for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
