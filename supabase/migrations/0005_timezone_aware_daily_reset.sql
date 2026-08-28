-- XYRON — Reinicio diario consciente de zona horaria
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0004_progression_foundation.sql. No borra ni toca ninguna fila existente —
-- agrega una columna nueva (con DEFAULT 0, o sea "tratar como UTC" hasta que
-- el cliente la corrija solo) y reemplaza dos funciones por versiones que
-- hacen exactamente lo mismo, evaluando "hoy" en la zona horaria del usuario
-- en vez de la del servidor (Postgres/Supabase usa UTC).
--
-- Bug real detectado probando la Fase 1: `complete_mission()` decidía "ya
-- completada hoy" comparando `completed_at::date = now()::date`, y
-- `fn_current_streak()` usaba `current_date` — ambos en la zona horaria del
-- servidor (UTC). Para cualquier usuario que no esté en UTC, "hoy" en el
-- navegador y "hoy" en la base pueden ser fechas distintas durante varias
-- horas por día (típicamente de noche/madrugada), lo que producía un
-- "Misión ya completada" falso para una misión que el cliente todavía
-- mostraba como disponible.

-- =========================================================
-- 1. profiles.timezone_offset_minutes — mismo valor que devuelve
--    `Date.prototype.getTimezoneOffset()` en el navegador (minutos que hay
--    que sumarle a la hora local para obtener UTC). Se completa solo al
--    registrarse (ver handle_new_user) y el cliente la mantiene al día si
--    detecta que cambió (viaje, cuenta vieja creada antes de esta migración).
-- =========================================================

alter table public.profiles
    add column timezone_offset_minutes integer not null default 0;

grant update (name, username, avatar_url, active_title_id, timezone_offset_minutes)
    on public.profiles to authenticated;

-- =========================================================
-- 2. fn_local_date — convierte un timestamp a la fecha de calendario tal
--    como la vería un usuario con ese offset (misma fórmula en todos lados).
-- =========================================================

create or replace function public.fn_local_date(p_ts timestamptz, p_offset_minutes integer)
returns date
language sql
immutable
as $$
    select (p_ts - (p_offset_minutes || ' minutes')::interval)::date;
$$;

-- =========================================================
-- 3. fn_current_streak() — misma lógica que antes, ahora en la zona horaria
--    del usuario (lee su offset guardado en profiles).
-- =========================================================

create or replace function public.fn_current_streak(p_user_id uuid)
returns integer
language plpgsql
stable
as $$
declare
    v_offset integer;
    v_dates date[];
    v_run integer := 1;
    v_last date;
    v_len integer;
begin
    select coalesce(timezone_offset_minutes, 0) into v_offset
    from public.profiles
    where id = p_user_id;

    select array_agg(distinct public.fn_local_date(completed_at, v_offset) order by public.fn_local_date(completed_at, v_offset))
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

    if (public.fn_local_date(now(), v_offset) - v_last) <= 1 then
        return v_run;
    end if;

    return 0;
end;
$$;

-- =========================================================
-- 4. complete_mission() — misma lógica de siempre, el chequeo de "ya
--    completada hoy" ahora usa la fecha local del usuario. El índice
--    user_missions_one_per_day sigue en UTC a propósito: es solo la red de
--    seguridad contra una condición de carrera (doble click), no la regla de
--    negocio — no puede referenciar profiles.timezone_offset_minutes desde
--    un índice de expresión, y no hace falta: el chequeo explícito de abajo
--    ya decide correctamente con la zona horaria real del usuario.
-- =========================================================

create or replace function public.complete_mission(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_offset integer;
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

    select coalesce(timezone_offset_minutes, 0) into v_offset
    from public.profiles
    where id = v_user_id;

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
              and public.fn_local_date(completed_at, v_offset) = public.fn_local_date(now(), v_offset)
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
-- 5. handle_new_user() — siembra timezone_offset_minutes desde el metadata
--    que manda el signup por email (ver src/services/authService.ts). Las
--    cuentas por Google/Facebook no mandan este metadata (arrancan en 0,
--    "UTC"), pero el cliente las autocorrige solo al primer login — ver
--    AppLayout.tsx.
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
    v_offset integer;
begin
    v_base := split_part(new.email, '@', 1);
    v_name := coalesce(new.raw_user_meta_data ->> 'name', v_base);
    v_username := coalesce(new.raw_user_meta_data ->> 'username', v_base) || '_' || substr(new.id::text, 1, 6);
    v_offset := coalesce((new.raw_user_meta_data ->> 'timezone_offset_minutes')::integer, 0);

    insert into public.profiles (id, name, username, timezone_offset_minutes)
    values (new.id, v_name, v_username, v_offset)
    on conflict (id) do nothing;

    insert into public.stats (user_id, name, value, max_value, icon, is_default, in_radar)
    values
        (new.id, 'Fuerza', 0, 10, 'Barbell', true, true),
        (new.id, 'Inteligencia', 0, 10, 'Brain', true, true),
        (new.id, 'Disciplina', 0, 10, 'ListChecks', true, true),
        (new.id, 'Creatividad', 0, 10, 'PaintBrush', true, true),
        (new.id, 'Enfoque', 0, 10, 'Target', true, true),
        (new.id, 'Carisma', 0, 10, 'ChatCircleDots', true, true)
    on conflict (user_id, name) do nothing;

    return new;
end;
$$;
