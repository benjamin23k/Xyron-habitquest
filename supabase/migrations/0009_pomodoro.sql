-- XYRON — Fase 4: Pomodoro / Focus Mode
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0008_skill_tree.sql. No borra ni toca ninguna fila existente — solo agrega
-- la tabla `pomodoro_sessions` y tres funciones RPC nuevas.
--
-- Contexto: el timer del cliente nunca es la fuente de verdad de cuánto
-- tiempo pasó — eso lo decide el servidor comparando `now()` contra el
-- `started_at` que ÉL mismo generó al arrancar la sesión (start_pomodoro_session),
-- nunca un timestamp que mande el navegador. Mismo principio anti-trampa que
-- ya usa complete_mission(): el cliente jamás decide cuánta recompensa le
-- corresponde. El flujo es: 1) start_pomodoro_session() crea la fila con
-- started_at = now() y devuelve su id; 2) al llegar a cero (o al cortar
-- manualmente) el cliente llama complete_pomodoro_session()/
-- stop_pomodoro_session(), y el servidor recién ahí calcula cuánto tiempo
-- real pasó y decide la recompensa.

-- =========================================================
-- 1. POMODORO_SESSIONS
-- =========================================================

create table public.pomodoro_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    mode text not null check (mode in ('focus', 'short_break', 'long_break')),
    duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 180),
    actual_minutes integer,
    stat text,
    mission_id uuid references public.missions (id) on delete set null,
    xp_awarded integer not null default 0,
    was_completed boolean not null default false,
    local_date date not null,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    created_at timestamptz not null default now()
);

create index pomodoro_sessions_user_date_idx on public.pomodoro_sessions (user_id, local_date);
create index pomodoro_sessions_user_started_idx on public.pomodoro_sessions (user_id, started_at desc);

alter table public.pomodoro_sessions enable row level security;

revoke all on public.pomodoro_sessions from anon, authenticated;

grant select on public.pomodoro_sessions to authenticated;

-- Sin insert/update directo: solo las RPC de abajo (SECURITY DEFINER)
-- pueden crear o cerrar una sesión.
create policy "pomodoro_sessions_select_own"
    on public.pomodoro_sessions for select
    using (user_id = auth.uid());

-- =========================================================
-- 2. start_pomodoro_session() — ancla started_at en el reloj del servidor.
-- =========================================================

create or replace function public.start_pomodoro_session(
    p_mode text,
    p_duration_minutes integer,
    p_stat text default null,
    p_mission_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_offset integer;
    v_session_id uuid;
begin
    if v_user_id is null then
        raise exception 'No autenticado';
    end if;

    if p_mode not in ('focus', 'short_break', 'long_break') then
        raise exception 'Modo inválido';
    end if;

    if p_duration_minutes is null or p_duration_minutes <= 0 or p_duration_minutes > 180 then
        raise exception 'Duración inválida';
    end if;

    if p_mission_id is not null and not exists (
        select 1 from public.missions
        where id = p_mission_id and (owner_user_id is null or owner_user_id = v_user_id)
    ) then
        raise exception 'Misión no encontrada';
    end if;

    select coalesce(timezone_offset_minutes, 0) into v_offset from public.profiles where id = v_user_id;

    insert into public.pomodoro_sessions (user_id, mode, duration_minutes, stat, mission_id, local_date, started_at)
    values (
        v_user_id, p_mode, p_duration_minutes, nullif(p_stat, ''), p_mission_id,
        public.fn_local_date(now(), v_offset), now()
    )
    returning id into v_session_id;

    return v_session_id;
end;
$$;

grant execute on function public.start_pomodoro_session(text, integer, text, uuid) to authenticated;

-- =========================================================
-- 3. complete_pomodoro_session() — solo paga si de verdad pasó (casi) todo
--    el tiempo planeado, medido server-side. Racha de foco: si la sesión de
--    foco completada anterior terminó hace ≤30 minutos, +10% XP.
-- =========================================================

create or replace function public.complete_pomodoro_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_session record;
    v_elapsed_minutes numeric;
    v_xp integer;
    v_bonus_applied boolean := false;
    v_old_level integer;
    v_old_xp integer;
    v_new_xp integer;
    v_new_level integer;
    v_previous_completed_at timestamptz;
begin
    if v_user_id is null then
        raise exception 'No autenticado';
    end if;

    select * into v_session
    from public.pomodoro_sessions
    where id = p_session_id and user_id = v_user_id
    for update;

    if not found then
        raise exception 'Sesión no encontrada';
    end if;

    if v_session.completed_at is not null then
        raise exception 'Esta sesión ya se cerró';
    end if;

    v_elapsed_minutes := extract(epoch from (now() - v_session.started_at)) / 60;

    -- Tolerancia del 10% (viaje de ida y vuelta de la request). Si pasó
    -- bastante menos que eso, se cierra como interrumpida sin recompensa.
    if v_elapsed_minutes < (v_session.duration_minutes * 0.9) then
        update public.pomodoro_sessions
        set completed_at = now(), was_completed = false, actual_minutes = greatest(floor(v_elapsed_minutes)::integer, 0)
        where id = p_session_id;

        return jsonb_build_object('was_completed', false, 'xp_gained', 0);
    end if;

    if v_session.mode = 'focus' then
        v_xp := least(v_session.duration_minutes, floor(v_elapsed_minutes)::integer);

        select completed_at into v_previous_completed_at
        from public.pomodoro_sessions
        where user_id = v_user_id
          and mode = 'focus'
          and was_completed = true
          and id != p_session_id
        order by completed_at desc
        limit 1;

        if v_previous_completed_at is not null and v_session.started_at - v_previous_completed_at <= interval '30 minutes' then
            v_xp := ceil(v_xp * 1.1);
            v_bonus_applied := true;
        end if;
    else
        v_xp := 0;
    end if;

    update public.pomodoro_sessions
    set completed_at = now(),
        was_completed = true,
        actual_minutes = least(v_session.duration_minutes, floor(v_elapsed_minutes)::integer),
        xp_awarded = v_xp
    where id = p_session_id;

    select level, xp into v_old_level, v_old_xp from public.profiles where id = v_user_id for update;

    v_new_xp := v_old_xp + v_xp;
    v_new_level := public.fn_level_for_xp(v_new_xp);

    if v_xp > 0 then
        update public.profiles set xp = v_new_xp, level = v_new_level where id = v_user_id;

        insert into public.xp_transactions (user_id, amount, reason, source_type, source_id)
        values (v_user_id, v_xp, 'Sesión de foco', 'pomodoro', p_session_id);
    end if;

    if v_session.mode = 'focus' and v_session.stat is not null then
        update public.stats
        set value = least(value + 1, max_value)
        where user_id = v_user_id and name = v_session.stat;
    end if;

    return jsonb_build_object(
        'was_completed', true,
        'xp_gained', v_xp,
        'coins_gained', 0,
        'stat', v_session.stat,
        'stat_gained', case when v_session.stat is not null then 1 else 0 end,
        'old_level', v_old_level,
        'new_level', v_new_level,
        'leveled_up', v_new_level > v_old_level,
        'new_xp', v_new_xp,
        'bonus_applied', v_bonus_applied
    );
end;
$$;

grant execute on function public.complete_pomodoro_session(uuid) to authenticated;

-- =========================================================
-- 4. stop_pomodoro_session() — corte manual (botón "Stop"), sin recompensa.
-- =========================================================

create or replace function public.stop_pomodoro_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_session record;
    v_elapsed_minutes numeric;
begin
    if v_user_id is null then
        raise exception 'No autenticado';
    end if;

    select * into v_session
    from public.pomodoro_sessions
    where id = p_session_id and user_id = v_user_id
    for update;

    if not found then
        raise exception 'Sesión no encontrada';
    end if;

    if v_session.completed_at is not null then
        return;
    end if;

    v_elapsed_minutes := extract(epoch from (now() - v_session.started_at)) / 60;

    update public.pomodoro_sessions
    set completed_at = now(), was_completed = false, actual_minutes = greatest(floor(v_elapsed_minutes)::integer, 0)
    where id = p_session_id;
end;
$$;

grant execute on function public.stop_pomodoro_session(uuid) to authenticated;
