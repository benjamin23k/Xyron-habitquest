-- XYRON — Fase 3 (retomada): Habit System
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0011_seasons.sql. No borra ni toca ninguna fila existente — solo agrega
-- dos tablas nuevas y una columna nullable en coin_transactions.
--
-- Contexto: el roadmap original separaba "Hábitos" de "Quests" (missions) —
-- un hábito es siempre personal (no hay hábitos de sistema como sí hay
-- misiones diarias precargadas), tiene una recompensa fija y baja (no elige
-- dificultad como una quest), y su métrica central es la RACHA/consistencia
-- propia, no el XP puntual. Reutiliza exactamente el mismo patrón anti-trampa
-- que missions/pomodoro: complete_habit() SECURITY DEFINER es la única
-- puerta de entrada para XP/monedas/stat; xp_reward/coin_reward/stat_reward
-- quedan fuera del GRANT de insert, así que toda fila nueva cae siempre en
-- los DEFAULT de la tabla sin importar qué mande el cliente.

-- =========================================================
-- 1. HABITS (catálogo — siempre personal, sin fila de "sistema")
-- =========================================================

create table public.habits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    title text not null,
    description text,
    icon text,
    category text,
    stat text,
    stat_reward integer not null default 1,
    xp_reward integer not null default 8,
    coin_reward integer not null default 4,
    frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
    status text not null default 'active' check (status in ('active', 'archived')),
    created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

revoke all on public.habits from anon, authenticated;

grant select on public.habits to authenticated;

-- Igual que missions: el cliente elige título/descripción/ícono/categoría/
-- atributo/repetición al crear su hábito, pero stat_reward/xp_reward/
-- coin_reward/status quedan fuera del GRANT — caen siempre en los DEFAULT.
grant insert (user_id, title, description, icon, category, stat, frequency) on public.habits to authenticated;

grant delete on public.habits to authenticated;

create policy "habits_select_own"
    on public.habits for select
    using (user_id = auth.uid());

create policy "habits_insert_own"
    on public.habits for insert
    with check (user_id = auth.uid());

create policy "habits_delete_own"
    on public.habits for delete
    using (user_id = auth.uid());

-- =========================================================
-- 2. HABIT_COMPLETIONS (historial — mismo patrón que user_missions)
-- =========================================================

create table public.habit_completions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    -- "set null" (no cascade): si se borra un hábito ya completado, el
    -- historial de esas completadas se mantiene (para racha/calendario) en
    -- vez de desaparecer silenciosamente — igual que user_missions.
    habit_id uuid references public.habits (id) on delete set null,
    completed_at timestamptz not null default now(),
    local_date date not null
);

-- Mismo criterio que user_missions_one_per_day (migración 0006): defensa
-- contra doble-click, basada en la fecha LOCAL del usuario, no UTC.
create unique index habit_completions_one_per_day
    on public.habit_completions (user_id, habit_id, local_date);

create index habit_completions_user_created_idx
    on public.habit_completions (user_id, completed_at desc);

alter table public.habit_completions enable row level security;

revoke all on public.habit_completions from anon, authenticated;

grant select on public.habit_completions to authenticated;

-- Sin insert/update/delete directo: la única puerta de entrada es complete_habit().
create policy "habit_completions_select_own"
    on public.habit_completions for select
    using (user_id = auth.uid());

-- =========================================================
-- 3. Ledger de monedas: mission_id ya existe pero apunta a missions, así que
--    agregamos una columna paralela para que las recompensas de hábitos
--    también queden auditadas en coin_transactions (misma tabla que ya lee
--    el resto de la app).
-- =========================================================

alter table public.coin_transactions
    add column habit_id uuid references public.habits (id) on delete set null;

-- =========================================================
-- 4. complete_habit() — única puerta de entrada para otorgar recompensas de
--    hábitos. "Ya completado" depende de la repetición: diaria compara por
--    día local, semanal por semana local (mismo criterio que complete_mission
--    con missions weekly, usando fn_local_date de la migración 0005).
-- =========================================================

create or replace function public.complete_habit(p_habit_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_offset integer;
    v_local_date date;
    v_habit record;
    v_already_completed boolean;
    v_old_level integer;
    v_old_xp integer;
    v_new_xp integer;
    v_new_level integer;
begin
    if v_user_id is null then
        raise exception 'No autenticado';
    end if;

    select coalesce(timezone_offset_minutes, 0) into v_offset
    from public.profiles
    where id = v_user_id;

    v_local_date := public.fn_local_date(now(), v_offset);

    select * into v_habit
    from public.habits
    where id = p_habit_id
      and user_id = v_user_id
      and status = 'active';

    if not found then
        raise exception 'Hábito no encontrado o no disponible';
    end if;

    if v_habit.frequency = 'weekly' then
        select exists (
            select 1 from public.habit_completions
            where user_id = v_user_id
              and habit_id = p_habit_id
              and date_trunc('week', local_date) = date_trunc('week', v_local_date)
        ) into v_already_completed;
    else
        select exists (
            select 1 from public.habit_completions
            where user_id = v_user_id
              and habit_id = p_habit_id
              and local_date = v_local_date
        ) into v_already_completed;
    end if;

    if v_already_completed then
        raise exception 'Hábito ya completado';
    end if;

    begin
        insert into public.habit_completions (user_id, habit_id, completed_at, local_date)
        values (v_user_id, p_habit_id, now(), v_local_date);
    exception
        when unique_violation then
            raise exception 'Hábito ya completado';
    end;

    if v_habit.stat is not null then
        update public.stats
        set value = least(value + v_habit.stat_reward, max_value)
        where user_id = v_user_id and name = v_habit.stat;
    end if;

    select level, xp into v_old_level, v_old_xp
    from public.profiles
    where id = v_user_id
    for update;

    v_new_xp := v_old_xp + v_habit.xp_reward;
    v_new_level := public.fn_level_for_xp(v_new_xp);

    update public.profiles
    set xp = v_new_xp,
        level = v_new_level,
        coins = coins + v_habit.coin_reward
    where id = v_user_id;

    insert into public.coin_transactions (user_id, amount, reason, habit_id)
    values (v_user_id, v_habit.coin_reward, v_habit.title, p_habit_id);

    insert into public.xp_transactions (user_id, amount, reason, source_type, source_id)
    values (v_user_id, v_habit.xp_reward, v_habit.title, 'habit', p_habit_id);

    return jsonb_build_object(
        'xp_gained', v_habit.xp_reward,
        'coins_gained', v_habit.coin_reward,
        'stat', v_habit.stat,
        'stat_gained', v_habit.stat_reward,
        'old_level', v_old_level,
        'new_level', v_new_level,
        'leveled_up', v_new_level > v_old_level,
        'new_xp', v_new_xp
    );
end;
$$;
