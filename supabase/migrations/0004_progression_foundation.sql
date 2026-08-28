-- XYRON — Foundation del sistema de progresión RPG (Fase 1)
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0003_phosphor_icon_keys.sql. No borra ni toca ninguna fila de usuario
-- existente — solo agrega tablas nuevas, una columna nueva en `profiles`
-- (nullable, sin default destructivo) y reemplaza `complete_mission()` por una
-- versión que hace todo lo mismo que hoy más un insert adicional en el ledger.
--
-- Contexto: hasta ahora los achievements vivían 100% en el cliente
-- (src/data/achievements.ts + localStorage), sin persistencia real ni
-- protección contra manipulación. Esta migración los mueve a Supabase como
-- catálogo + estado de desbloqueo server-validado, agrega un ledger auditable
-- de XP (mismo patrón que coin_transactions, que ya existe), y deja la base
-- (tablas skills/user_skills vacías) para el Skill Tree de una fase futura.

-- =========================================================
-- 1. XP_TRANSACTIONS — ledger auditable, mismo patrón que coin_transactions
-- =========================================================

create table public.xp_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    amount integer not null,
    reason text not null,
    source_type text not null,
    source_id uuid,
    created_at timestamptz not null default now()
);

create index xp_transactions_user_created_idx
    on public.xp_transactions (user_id, created_at desc);

alter table public.xp_transactions enable row level security;

revoke all on public.xp_transactions from anon, authenticated;

grant select on public.xp_transactions to authenticated;

-- Sin insert/update/delete directo: solo lo escriben complete_mission() y
-- sync_progression() (ambas SECURITY DEFINER), igual que coin_transactions.
create policy "xp_transactions_select_own"
    on public.xp_transactions for select
    using (user_id = auth.uid());

-- =========================================================
-- 2. ACHIEVEMENTS — catálogo (world data, no editable por el cliente)
-- =========================================================

create table public.achievements (
    id uuid primary key default gen_random_uuid(),
    key text not null unique,
    name text not null,
    description text not null,
    category text not null check (category in
        ('discipline', 'knowledge', 'fitness', 'creativity', 'productivity', 'exploration', 'special')),
    rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary', 'mythic')),
    requirement_type text not null check (requirement_type in
        ('quests_completed', 'all_quests', 'streak', 'level', 'balanced_stats')),
    requirement_value integer not null default 0,
    xp_reward integer not null default 0,
    icon text not null,
    is_hidden boolean not null default false,
    created_at timestamptz not null default now()
);

alter table public.achievements enable row level security;

revoke all on public.achievements from anon, authenticated;

grant select on public.achievements to authenticated;

create policy "achievements_select_all"
    on public.achievements for select
    using (true);

-- =========================================================
-- 3. USER_ACHIEVEMENTS — estado de desbloqueo por usuario
-- =========================================================

create table public.user_achievements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    achievement_id uuid not null references public.achievements (id) on delete cascade,
    unlocked_at timestamptz not null default now(),
    unique (user_id, achievement_id)
);

create index user_achievements_user_idx on public.user_achievements (user_id);

alter table public.user_achievements enable row level security;

revoke all on public.user_achievements from anon, authenticated;

grant select on public.user_achievements to authenticated;

-- Sin insert/update/delete directo: solo sync_progression() (SECURITY DEFINER)
-- puede desbloquear un logro, así uno oculto no se puede falsear desde la API.
create policy "user_achievements_select_own"
    on public.user_achievements for select
    using (user_id = auth.uid());

-- =========================================================
-- 4. TITLES — catálogo + estado de desbloqueo + título activo en profiles
-- =========================================================

create table public.titles (
    id uuid primary key default gen_random_uuid(),
    key text not null unique,
    name text not null,
    description text not null,
    requirement_type text not null check (requirement_type in ('level')),
    requirement_value integer not null default 1,
    rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary', 'mythic')),
    created_at timestamptz not null default now()
);

alter table public.titles enable row level security;

revoke all on public.titles from anon, authenticated;

grant select on public.titles to authenticated;

create policy "titles_select_all"
    on public.titles for select
    using (true);

create table public.user_titles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    title_id uuid not null references public.titles (id) on delete cascade,
    unlocked_at timestamptz not null default now(),
    unique (user_id, title_id)
);

create index user_titles_user_idx on public.user_titles (user_id);

alter table public.user_titles enable row level security;

revoke all on public.user_titles from anon, authenticated;

grant select on public.user_titles to authenticated;

-- Sin insert/update/delete directo: solo sync_progression() desbloquea títulos.
create policy "user_titles_select_own"
    on public.user_titles for select
    using (user_id = auth.uid());

alter table public.profiles
    add column active_title_id uuid references public.titles (id) on delete set null;

-- El usuario elige su propio título entre los que ya desbloqueó — no requiere
-- una RPC: el WITH CHECK exige que exista una fila en user_titles que lo
-- respalde, así que un id inventado o de un logro no propio queda bloqueado
-- por RLS igual que si fuera un intento directo por API.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
    on public.profiles for update
    using (id = auth.uid())
    with check (
        id = auth.uid()
        and (
            active_title_id is null
            or exists (
                select 1 from public.user_titles
                where user_id = auth.uid() and title_id = profiles.active_title_id
            )
        )
    );

grant update (name, username, avatar_url, active_title_id) on public.profiles to authenticated;

-- =========================================================
-- 5. SKILLS / USER_SKILLS — esqueleto vacío para el Skill Tree (fase futura)
-- =========================================================

create table public.skills (
    id uuid primary key default gen_random_uuid(),
    key text not null unique,
    name text not null,
    description text not null,
    icon text not null,
    category text not null,
    stat_key text,
    cost integer not null default 1,
    requires_skill_id uuid references public.skills (id),
    min_level integer not null default 1,
    created_at timestamptz not null default now()
);

alter table public.skills enable row level security;

revoke all on public.skills from anon, authenticated;

grant select on public.skills to authenticated;

create policy "skills_select_all"
    on public.skills for select
    using (true);

create table public.user_skills (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    skill_id uuid not null references public.skills (id) on delete cascade,
    unlocked_at timestamptz not null default now(),
    unique (user_id, skill_id)
);

create index user_skills_user_idx on public.user_skills (user_id);

alter table public.user_skills enable row level security;

revoke all on public.user_skills from anon, authenticated;

grant select on public.user_skills to authenticated;

create policy "user_skills_select_own"
    on public.user_skills for select
    using (user_id = auth.uid());

-- =========================================================
-- 6. fn_current_streak — misma semántica que systems/streak.ts
--    (racha = corrida de días consecutivos que termina hoy o ayer)
-- =========================================================

create or replace function public.fn_current_streak(p_user_id uuid)
returns integer
language plpgsql
stable
as $$
declare
    v_dates date[];
    v_run integer := 1;
    v_last date;
    v_len integer;
begin
    select array_agg(distinct completed_at::date order by completed_at::date)
    into v_dates
    from public.user_missions
    where user_id = p_user_id;

    v_len := coalesce(array_length(v_dates, 1), 0);

    if v_len = 0 then
        return 0;
    end if;

    for i in 2..v_len loop
        if v_dates[i] - v_dates[i - 1] = 1 then
            v_run := v_run + 1;
        else
            v_run := 1;
        end if;
    end loop;

    v_last := v_dates[v_len];

    if (current_date - v_last) <= 1 then
        return v_run;
    end if;

    return 0;
end;
$$;

-- =========================================================
-- 7. sync_progression() — evalúa y desbloquea achievements + titles
-- =========================================================

create or replace function public.sync_progression()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_level integer;
    v_completed_quests integer;
    v_total_quests integer;
    v_streak integer;
    v_stat_count integer;
    v_balanced boolean;
    v_achievement record;
    v_title record;
    v_newly_unlocked_achievements text[] := '{}';
    v_newly_unlocked_titles text[] := '{}';
    v_xp_awarded integer := 0;
begin
    if v_user_id is null then
        raise exception 'No autenticado';
    end if;

    select level into v_level from public.profiles where id = v_user_id;

    select count(distinct mission_id) into v_completed_quests
    from public.user_missions
    where user_id = v_user_id and mission_id is not null;

    select count(*) into v_total_quests from public.missions where status = 'active';

    v_streak := public.fn_current_streak(v_user_id);

    select count(*), coalesce(bool_and(value >= 1), false)
    into v_stat_count, v_balanced
    from public.stats
    where user_id = v_user_id;

    v_balanced := v_balanced and v_stat_count > 0;

    for v_achievement in
        select a.* from public.achievements a
        where not exists (
            select 1 from public.user_achievements ua
            where ua.user_id = v_user_id and ua.achievement_id = a.id
        )
    loop
        if (
            (v_achievement.requirement_type = 'quests_completed' and v_completed_quests >= v_achievement.requirement_value)
            or (v_achievement.requirement_type = 'all_quests' and v_total_quests > 0 and v_completed_quests >= v_total_quests)
            or (v_achievement.requirement_type = 'streak' and v_streak >= v_achievement.requirement_value)
            or (v_achievement.requirement_type = 'level' and v_level >= v_achievement.requirement_value)
            or (v_achievement.requirement_type = 'balanced_stats' and v_balanced)
        ) then
            insert into public.user_achievements (user_id, achievement_id)
            values (v_user_id, v_achievement.id)
            on conflict (user_id, achievement_id) do nothing;

            if found then
                v_newly_unlocked_achievements := array_append(v_newly_unlocked_achievements, v_achievement.key);

                if v_achievement.xp_reward > 0 then
                    insert into public.xp_transactions (user_id, amount, reason, source_type, source_id)
                    values (v_user_id, v_achievement.xp_reward, v_achievement.name, 'achievement', v_achievement.id);

                    v_xp_awarded := v_xp_awarded + v_achievement.xp_reward;
                end if;
            end if;
        end if;
    end loop;

    for v_title in
        select t.* from public.titles t
        where t.requirement_type = 'level'
          and not exists (
              select 1 from public.user_titles ut
              where ut.user_id = v_user_id and ut.title_id = t.id
          )
    loop
        if v_level >= v_title.requirement_value then
            insert into public.user_titles (user_id, title_id)
            values (v_user_id, v_title.id)
            on conflict (user_id, title_id) do nothing;

            if found then
                v_newly_unlocked_titles := array_append(v_newly_unlocked_titles, v_title.key);
            end if;
        end if;
    end loop;

    if v_xp_awarded > 0 then
        update public.profiles
        set xp = xp + v_xp_awarded,
            level = public.fn_level_for_xp(xp + v_xp_awarded)
        where id = v_user_id;
    end if;

    return jsonb_build_object(
        'unlocked_achievements', to_jsonb(v_newly_unlocked_achievements),
        'unlocked_titles', to_jsonb(v_newly_unlocked_titles),
        'xp_awarded', v_xp_awarded
    );
end;
$$;

grant execute on function public.sync_progression() to authenticated;

-- =========================================================
-- 8. complete_mission() — misma lógica de siempre + un insert en el ledger
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

    insert into public.xp_transactions (user_id, amount, reason, source_type, source_id)
    values (v_user_id, v_mission.xp_reward, v_mission.title, 'mission', p_mission_id);

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

-- =========================================================
-- 9. Seed — logros (los 7 actuales + 3 ocultos nuevos) y títulos
-- =========================================================

insert into public.achievements (key, name, description, category, rarity, requirement_type, requirement_value, xp_reward, icon, is_hidden)
values
    ('first-quest', 'Primer paso', 'Completa tu primera misión.', 'productivity', 'common', 'quests_completed', 1, 25, 'Medal', false),
    ('quest-master', 'Cazador de misiones', 'Completa 3 misiones.', 'productivity', 'common', 'quests_completed', 3, 50, 'Target', false),
    ('all-quests', 'Leyenda viviente', 'Completa todas las misiones disponibles.', 'productivity', 'rare', 'all_quests', 0, 100, 'Trophy', false),
    ('streak-3', 'Constancia', 'Alcanza una racha de 3 días.', 'discipline', 'common', 'streak', 3, 30, 'Fire', false),
    ('streak-7', 'Semana perfecta', 'Alcanza una racha de 7 días.', 'discipline', 'rare', 'streak', 7, 75, 'Lightning', false),
    ('level-5', 'Ascenso', 'Llega al nivel 5.', 'special', 'rare', 'level', 5, 100, 'Star', false),
    ('balanced', 'Equilibrado', 'Sube todas tus estadísticas al menos una vez.', 'special', 'common', 'balanced_stats', 0, 50, 'Compass', false),
    ('quest-legend', 'Leyenda de las misiones', 'Completa 10 misiones.', 'productivity', 'epic', 'quests_completed', 10, 150, 'Crown', true),
    ('streak-30', 'Inquebrantable', 'Alcanza una racha de 30 días.', 'discipline', 'legendary', 'streak', 30, 300, 'Fire', true),
    ('level-20', 'Ícono', 'Llega al nivel 20.', 'special', 'epic', 'level', 20, 200, 'Sparkle', true)
on conflict (key) do nothing;

insert into public.titles (key, name, description, requirement_type, requirement_value, rarity)
values
    ('the-builder', 'The Builder', 'Empezaste a construir tu progreso.', 'level', 1, 'common'),
    ('the-disciplined', 'The Disciplined', 'La constancia ya es tu marca.', 'level', 5, 'common'),
    ('the-scholar', 'The Scholar', 'El conocimiento es tu arma.', 'level', 10, 'rare'),
    ('the-explorer', 'The Explorer', 'Nunca dejás de avanzar.', 'level', 15, 'rare'),
    ('the-strategist', 'The Strategist', 'Cada acción tiene un propósito.', 'level', 20, 'epic'),
    ('the-iron-mind', 'The Iron Mind', 'Nada te desvía del camino.', 'level', 25, 'epic'),
    ('the-code-mage', 'The Code Mage', 'Dominás tu oficio.', 'level', 30, 'legendary'),
    ('the-creator', 'The Creator', 'Tu progreso ya es una obra propia.', 'level', 35, 'mythic')
on conflict (key) do nothing;
