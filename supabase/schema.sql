-- XYRON — Fase 1: Auth + Perfil + Misiones + Monedas
-- Ejecutar completo en Supabase → SQL Editor, en un proyecto nuevo.
-- Es idempotente-friendly en el sentido de que usa "if not exists" donde aplica,
-- pero está pensado para correr una sola vez sobre una base limpia.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. PROFILES
-- =========================================================

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    name text not null,
    username text not null unique,
    avatar_url text,
    level integer not null default 1,
    xp integer not null default 0,
    coins integer not null default 0,
    rank text not null default 'Novato',
    membership text not null default 'FREE',
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;

grant select on public.profiles to authenticated;

-- El usuario puede editar su propio nombre/username/avatar, pero NO xp/coins/level/
-- rank/membership: esas columnas no están en este GRANT, así que ni siquiera un UPDATE
-- directo desde el navegador puede tocarlas (Postgres exige privilegio por columna).
grant update (name, username, avatar_url) on public.profiles to authenticated;

create policy "profiles_select_own"
    on public.profiles for select
    using (id = auth.uid());

create policy "profiles_update_own"
    on public.profiles for update
    using (id = auth.uid())
    with check (id = auth.uid());

-- =========================================================
-- 2. STATS
-- =========================================================

create table public.stats (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    name text not null,
    value integer not null default 0,
    max_value integer not null default 10,
    created_at timestamptz not null default now(),
    unique (user_id, name)
);

alter table public.stats enable row level security;

revoke all on public.stats from anon, authenticated;

grant select on public.stats to authenticated;

-- El usuario puede crear SUS propias stats nuevas (el "+ Nueva estadística" del
-- StatsManager), pero solo puede fijar user_id/name: value/max_value quedan fuera
-- del GRANT, así que toda stat nueva arranca siempre en 0/10 (los DEFAULT de la
-- tabla) sin importar qué mande el cliente. Igual que las misiones, value/max_value
-- solo los toca complete_mission() (SECURITY DEFINER) después.
grant insert (user_id, name) on public.stats to authenticated;

create policy "stats_select_own"
    on public.stats for select
    using (user_id = auth.uid());

create policy "stats_insert_own"
    on public.stats for insert
    with check (user_id = auth.uid());

-- =========================================================
-- 3. MISSIONS
-- =========================================================

create table public.missions (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid references public.profiles (id) on delete cascade,
    title text not null,
    description text,
    difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard', 'epic')),
    category text,
    stat text,
    stat_reward integer not null default 1,
    xp_reward integer not null default 15,
    coin_reward integer not null default 10,
    frequency text not null default 'daily' check (frequency in ('daily', 'once')),
    due_date timestamptz,
    status text not null default 'active' check (status in ('active', 'archived')),
    created_at timestamptz not null default now()
);

alter table public.missions enable row level security;

revoke all on public.missions from anon, authenticated;

grant select on public.missions to authenticated;

-- Clave anti-trampa: el cliente SOLO puede insertar estas columnas al crear una misión
-- propia. difficulty/stat_reward/xp_reward/coin_reward/frequency/status quedan fuera
-- del GRANT, así que toda misión creada desde el navegador cae siempre en los DEFAULT
-- de la tabla (1 stat, 15 XP, 10 XYR, diaria) sin importar qué mande el cliente.
grant insert (owner_user_id, title, description, category, stat) on public.missions to authenticated;

grant delete on public.missions to authenticated;

create policy "missions_select_visible"
    on public.missions for select
    using (owner_user_id is null or owner_user_id = auth.uid());

create policy "missions_insert_own"
    on public.missions for insert
    with check (owner_user_id = auth.uid());

create policy "missions_delete_own"
    on public.missions for delete
    using (owner_user_id = auth.uid());

-- =========================================================
-- 4. USER_MISSIONS (historial de completado)
-- =========================================================

create table public.user_missions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    -- "set null" (no cascade): si se borra una misión personalizada ya completada,
    -- el historial de esa completada se mantiene (para racha/calendario) en vez de
    -- desaparecer silenciosamente.
    mission_id uuid references public.missions (id) on delete set null,
    completed_at timestamptz not null default now()
);

-- Defensa contra condición de carrera: si el cliente dispara complete_mission()
-- dos veces casi simultáneo para la misma misión diaria (p. ej. doble clic antes de
-- que el botón se deshabilite), la segunda inserción choca con este índice en vez
-- de colarse como una recompensa duplicada.
create unique index user_missions_one_per_day
    on public.user_missions (user_id, mission_id, (completed_at::date));

alter table public.user_missions enable row level security;

revoke all on public.user_missions from anon, authenticated;

grant select on public.user_missions to authenticated;

-- Sin insert/update/delete directo: la única puerta de entrada es complete_mission().
create policy "user_missions_select_own"
    on public.user_missions for select
    using (user_id = auth.uid());

-- =========================================================
-- 5. COIN_TRANSACTIONS (ledger de solo lectura para el cliente)
-- =========================================================

create table public.coin_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    amount integer not null,
    reason text not null,
    mission_id uuid references public.missions (id) on delete set null,
    created_at timestamptz not null default now()
);

alter table public.coin_transactions enable row level security;

revoke all on public.coin_transactions from anon, authenticated;

grant select on public.coin_transactions to authenticated;

create policy "coin_transactions_select_own"
    on public.coin_transactions for select
    using (user_id = auth.uid());

-- =========================================================
-- 6. Progresión de nivel (misma fórmula que src/systems/progression.ts)
-- =========================================================

create or replace function public.fn_xp_required(p_level integer)
returns integer
language sql
immutable
as $$
    select floor(100 * power(1.2, p_level - 1))::integer;
$$;

create or replace function public.fn_level_for_xp(p_total_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
    v_level integer := 1;
    v_remaining integer := p_total_xp;
begin
    while v_remaining >= public.fn_xp_required(v_level) loop
        v_remaining := v_remaining - public.fn_xp_required(v_level);
        v_level := v_level + 1;
    end loop;

    return v_level;
end;
$$;

-- =========================================================
-- 7. complete_mission() — única puerta de entrada para otorgar recompensas
-- =========================================================

create or replace function public.complete_mission(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_mission record;
    v_already_completed boolean;
    v_old_level integer;
    v_old_xp integer;
    v_new_xp integer;
    v_new_level integer;
begin
    if v_user_id is null then
        raise exception 'No autenticado';
    end if;

    select * into v_mission
    from public.missions
    where id = p_mission_id
      and (owner_user_id is null or owner_user_id = v_user_id)
      and status = 'active';

    if not found then
        raise exception 'Misión no encontrada o no disponible';
    end if;

    if v_mission.frequency = 'daily' then
        select exists (
            select 1 from public.user_missions
            where user_id = v_user_id
              and mission_id = p_mission_id
              and completed_at::date = now()::date
        ) into v_already_completed;
    else
        select exists (
            select 1 from public.user_missions
            where user_id = v_user_id
              and mission_id = p_mission_id
        ) into v_already_completed;
    end if;

    if v_already_completed then
        raise exception 'Misión ya completada';
    end if;

    begin
        insert into public.user_missions (user_id, mission_id, completed_at)
        values (v_user_id, p_mission_id, now());
    exception
        when unique_violation then
            raise exception 'Misión ya completada';
    end;

    if v_mission.stat is not null then
        update public.stats
        set value = least(value + v_mission.stat_reward, max_value)
        where user_id = v_user_id and name = v_mission.stat;
    end if;

    -- Lock de la fila del perfil: evita condiciones de carrera si el cliente
    -- dispara dos completados casi simultáneos para la misma misión.
    select level, xp into v_old_level, v_old_xp
    from public.profiles
    where id = v_user_id
    for update;

    v_new_xp := v_old_xp + v_mission.xp_reward;
    v_new_level := public.fn_level_for_xp(v_new_xp);

    update public.profiles
    set xp = v_new_xp,
        level = v_new_level,
        coins = coins + v_mission.coin_reward
    where id = v_user_id;

    insert into public.coin_transactions (user_id, amount, reason, mission_id)
    values (v_user_id, v_mission.coin_reward, v_mission.title, p_mission_id);

    return jsonb_build_object(
        'xp_gained', v_mission.xp_reward,
        'coins_gained', v_mission.coin_reward,
        'stat', v_mission.stat,
        'stat_gained', v_mission.stat_reward,
        'old_level', v_old_level,
        'new_level', v_new_level,
        'leveled_up', v_new_level > v_old_level,
        'new_xp', v_new_xp
    );
end;
$$;

grant execute on function public.complete_mission(uuid) to authenticated;

-- =========================================================
-- 8. Alta automática de perfil + stats semilla al registrarse
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_base text;
    v_name text;
    v_username text;
begin
    v_base := split_part(new.email, '@', 1);
    v_name := coalesce(new.raw_user_meta_data ->> 'name', v_base);
    v_username := coalesce(new.raw_user_meta_data ->> 'username', v_base) || '_' || substr(new.id::text, 1, 6);

    insert into public.profiles (id, name, username)
    values (new.id, v_name, v_username)
    on conflict (id) do nothing;

    insert into public.stats (user_id, name, value, max_value)
    values
        (new.id, 'Fuerza', 0, 10),
        (new.id, 'Inteligencia', 0, 10),
        (new.id, 'Disciplina', 0, 10),
        (new.id, 'Creatividad', 0, 10),
        (new.id, 'Enfoque', 0, 10),
        (new.id, 'Carisma', 0, 10)
    on conflict (user_id, name) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- =========================================================
-- 9. Misiones de sistema (seed) — mismas 6 de src/data/quests.ts
-- =========================================================

insert into public.missions (owner_user_id, title, description, difficulty, category, stat, stat_reward, xp_reward, coin_reward, frequency)
values
    (null, 'Entrenamiento físico', 'Haz al menos 30 minutos de ejercicio.', 'easy', 'salud', 'Fuerza', 1, 15, 10, 'daily'),
    (null, 'Sesión de lectura', 'Lee 20 páginas de un libro.', 'easy', 'mente', 'Inteligencia', 1, 15, 10, 'daily'),
    (null, 'Rutina sin excusas', 'Cumple tu rutina diaria completa.', 'easy', 'disciplina', 'Disciplina', 1, 15, 10, 'daily'),
    (null, 'Proyecto creativo', 'Dedica tiempo a crear algo nuevo.', 'easy', 'creatividad', 'Creatividad', 1, 15, 10, 'daily'),
    (null, 'Trabajo profundo', 'Completa una sesión de foco sin distracciones.', 'easy', 'enfoque', 'Enfoque', 1, 15, 10, 'daily'),
    (null, 'Conexión social', 'Inicia una conversación con alguien nuevo.', 'easy', 'social', 'Carisma', 1, 15, 10, 'daily');
