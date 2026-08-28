-- XYRON — Corrige el índice anti-duplicado de misiones diarias
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0005_timezone_aware_daily_reset.sql. No borra filas — agrega una columna
-- nueva a user_missions (backfillada) y reemplaza el índice único por uno
-- equivalente pero correcto en zona horaria.
--
-- Bug real detectado probando el fix de 0005: `fn_local_date()` calcula bien
-- "hoy" en la zona horaria del usuario, y el chequeo explícito dentro de
-- complete_mission() ya lo usaba — pero el índice único
-- `user_missions_one_per_day` seguía definido sobre `completed_at::date`
-- (fecha en UTC, no en la del usuario). Para cualquier offset != 0, hay una
-- franja de varias horas por día donde el día local y el día UTC no
-- coinciden: una misión completada tarde en la noche local (pero todavía
-- dentro del mismo día UTC) chocaba contra el índice al día siguiente local,
-- aunque el chequeo explícito ya la hubiera dejado pasar como "un día nuevo".
-- Como un índice de expresión no puede consultar `profiles` (no es
-- IMMUTABLE), la fecha local se materializa en una columna propia al
-- completar la misión, y el índice único pasa a usar esa columna.

-- =========================================================
-- 1. user_missions.local_date — fecha de calendario en la zona horaria del
--    usuario en el momento de completar, calculada una sola vez al insertar.
-- =========================================================

alter table public.user_missions
    add column local_date date;

update public.user_missions um
set local_date = public.fn_local_date(um.completed_at, coalesce(p.timezone_offset_minutes, 0))
from public.profiles p
where p.id = um.user_id
  and um.local_date is null;

alter table public.user_missions
    alter column local_date set not null;

-- =========================================================
-- 2. Índice único: mismo propósito de siempre (red de seguridad contra
--    condición de carrera en misiones diarias), ahora en la fecha correcta.
-- =========================================================

drop index if exists user_missions_one_per_day;

create unique index user_missions_one_per_day
    on public.user_missions (user_id, mission_id, local_date);

-- =========================================================
-- 3. complete_mission() — calcula la fecha local una sola vez y la reusa
--    tanto para el chequeo explícito como para el insert.
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
    v_local_date date;
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

    v_local_date := public.fn_local_date(now(), v_offset);

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
              and local_date = v_local_date
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
        insert into public.user_missions (user_id, mission_id, completed_at, local_date)
        values (v_user_id, p_mission_id, now(), v_local_date);
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
