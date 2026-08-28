-- XYRON — Fase 2: Sistema de misiones (5 dificultades, más repeticiones,
-- deadline, tiempo estimado)
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0006_fix_daily_unique_constraint.sql. No borra ni toca ninguna fila
-- existente — las 6 misiones de sistema conservan su xp_reward/coin_reward
-- históricos tal cual están (15 XP / 10 XYR). El mapeo de dificultad ↦
-- recompensa que agrega esta migración solo se aplica a misiones NUEVAS
-- creadas desde ahora en adelante (vía un trigger BEFORE INSERT).
--
-- Contexto: hoy `missions.difficulty` solo acepta easy/medium/hard/epic y
-- `frequency` solo daily/once, y el formulario de misión personalizada no
-- deja elegir nada de eso (arranca siempre en los DEFAULT de la tabla). Esta
-- migración agrega la dificultad LEGENDARY y las repeticiones weekly/monthly/
-- challenge del pedido del usuario, y deja que el cliente SÍ elija dificultad
-- y repetición al crear una misión — pero la recompensa numérica sigue sin
-- ser confiable desde el cliente: la fija un trigger server-side a partir de
-- una tabla fija de dificultad ↦ XP/monedas, nunca un valor que mande el
-- navegador. Mismo principio anti-trampa que ya usa el resto de la app.

-- =========================================================
-- 1. Nuevos valores permitidos + columna de tiempo estimado
-- =========================================================

alter table public.missions
    drop constraint missions_difficulty_check,
    add constraint missions_difficulty_check
        check (difficulty in ('easy', 'medium', 'hard', 'epic', 'legendary'));

alter table public.missions
    drop constraint missions_frequency_check,
    add constraint missions_frequency_check
        check (frequency in ('daily', 'weekly', 'monthly', 'once', 'challenge'));

alter table public.missions
    add column estimated_minutes integer;

-- =========================================================
-- 2. Recompensa por dificultad — tabla fija, nunca confiada del cliente.
--    EASY 10 XP · NORMAL(medium) 25 XP · HARD 50 XP · EPIC 100 XP ·
--    LEGENDARY 250 XP (monedas ≈ 60% del XP, mismo criterio que ya
--    usaban las misiones de sistema).
-- =========================================================

create or replace function public.fn_apply_difficulty_rewards()
returns trigger
language plpgsql
as $$
begin
    case new.difficulty
        when 'easy' then
            new.xp_reward := 10;
            new.coin_reward := 5;
        when 'medium' then
            new.xp_reward := 25;
            new.coin_reward := 15;
        when 'hard' then
            new.xp_reward := 50;
            new.coin_reward := 30;
        when 'epic' then
            new.xp_reward := 100;
            new.coin_reward := 60;
        when 'legendary' then
            new.xp_reward := 250;
            new.coin_reward := 150;
        else
            new.xp_reward := 10;
            new.coin_reward := 5;
    end case;

    return new;
end;
$$;

drop trigger if exists missions_apply_difficulty_rewards on public.missions;
create trigger missions_apply_difficulty_rewards
    before insert on public.missions
    for each row execute function public.fn_apply_difficulty_rewards();

-- =========================================================
-- 3. Privilegios: el cliente ahora puede elegir dificultad/repetición/
--    deadline/tiempo estimado al crear su propia misión — sigue sin poder
--    tocar xp_reward/coin_reward/stat_reward/status (fuera del GRANT, y
--    aunque los mandara, el trigger de arriba pisa xp_reward/coin_reward de
--    todos modos).
-- =========================================================

revoke insert on public.missions from authenticated;

grant insert (
    owner_user_id, title, description, category, stat,
    difficulty, frequency, due_date, estimated_minutes
) on public.missions to authenticated;

-- =========================================================
-- 4. complete_mission() — el chequeo de "ya completada" ahora depende de la
--    repetición de la misión, no solo de "hoy": diaria compara por día
--    local, semanal por semana local, mensual por mes local (ambos
--    derivados de la misma columna local_date de 0006 — sin matemática de
--    zona horaria nueva), y once/challenge siguen siendo "una sola vez, para
--    siempre" como ya era antes para todo lo no-diario.
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
    elsif v_mission.frequency = 'weekly' then
        select exists (
            select 1 from public.user_missions
            where user_id = v_user_id
              and mission_id = p_mission_id
              and date_trunc('week', local_date) = date_trunc('week', v_local_date)
        ) into v_already_completed;
    elsif v_mission.frequency = 'monthly' then
        select exists (
            select 1 from public.user_missions
            where user_id = v_user_id
              and mission_id = p_mission_id
              and date_trunc('month', local_date) = date_trunc('month', v_local_date)
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
