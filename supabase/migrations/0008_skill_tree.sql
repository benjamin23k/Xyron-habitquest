-- XYRON — Fase 3: Skill Tree
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0007_quest_system_upgrade.sql. No borra ni toca ninguna fila existente —
-- `skills`/`user_skills` ya existían vacías desde 0004 (pensadas para esta
-- fase); esta migración solo las llena con contenido y agrega la RPC de
-- desbloqueo.
--
-- Contexto: los Skill Points se obtienen al subir de nivel (1 por nivel) y
-- NO se guardan en una columna aparte — se derivan siempre como
-- `level - suma(cost de las skills ya desbloqueadas)`, así nunca pueden
-- desincronizarse del progreso real (mismo criterio que ya usa el resto de
-- XYRON para "no duplicar información calculable"). El árbol tiene 6 ramas
-- (una por atributo base: Fuerza, Inteligencia, Disciplina, Enfoque,
-- Creatividad, Carisma), 3 niveles cada una, cada nivel requiere el anterior
-- de esa misma rama. `unlock_skill()` valida nivel mínimo + costo + prerrequisito
-- server-side — el cliente nunca decide si un desbloqueo es válido.

-- =========================================================
-- 1. Seed del árbol — 6 ramas × 3 niveles
-- =========================================================

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
values
    ('strength-1', 'Fuerza base', 'Aumenta tu resistencia física.', 'Barbell', 'Fuerza', 'Fuerza', 1, null, 2),
    ('knowledge-1', 'Lectura', 'Absorbés información más rápido.', 'BookOpen', 'Inteligencia', 'Inteligencia', 1, null, 2),
    ('discipline-1', 'Constancia', 'Cumplís tus rutinas sin esfuerzo extra.', 'ListChecks', 'Disciplina', 'Disciplina', 1, null, 2),
    ('focus-1', 'Atención', 'Te distraés menos con estímulos externos.', 'Eye', 'Enfoque', 'Enfoque', 1, null, 2),
    ('creativity-1', 'Inspiración', 'Las ideas te llegan con más frecuencia.', 'PaintBrush', 'Creatividad', 'Creatividad', 1, null, 2),
    ('charisma-1', 'Expresión', 'Comunicás tus ideas con más claridad.', 'ChatCircleDots', 'Carisma', 'Carisma', 1, null, 2)
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'strength-2', 'Resistencia', 'Tu cuerpo aguanta más esfuerzo.', 'Heartbeat', 'Fuerza', 'Fuerza', 2, id, 5
from public.skills where key = 'strength-1'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'knowledge-2', 'Memoria', 'Retenés lo que aprendés por más tiempo.', 'Brain', 'Inteligencia', 'Inteligencia', 2, id, 5
from public.skills where key = 'knowledge-1'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'discipline-2', 'Voluntad', 'Resistís mejor la tentación de abandonar.', 'ShieldCheck', 'Disciplina', 'Disciplina', 2, id, 5
from public.skills where key = 'discipline-1'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'focus-2', 'Concentración', 'Sostenés el foco por períodos más largos.', 'Crosshair', 'Enfoque', 'Enfoque', 2, id, 5
from public.skills where key = 'focus-1'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'creativity-2', 'Experimentación', 'Te animás a probar enfoques nuevos.', 'Flask', 'Creatividad', 'Creatividad', 2, id, 5
from public.skills where key = 'creativity-1'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'charisma-2', 'Conexión', 'Generás vínculos genuinos más rápido.', 'Users', 'Carisma', 'Carisma', 2, id, 5
from public.skills where key = 'charisma-1'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'strength-3', 'Poder', 'Tu fuerza física alcanza su máximo potencial.', 'Lightning', 'Fuerza', 'Fuerza', 3, id, 10
from public.skills where key = 'strength-2'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'knowledge-3', 'Aprendizaje profundo', 'Dominás conceptos complejos con facilidad.', 'GraduationCap', 'Inteligencia', 'Inteligencia', 3, id, 10
from public.skills where key = 'knowledge-2'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'discipline-3', 'Trabajo profundo', 'Alcanzás estados de máxima productividad.', 'Target', 'Disciplina', 'Disciplina', 3, id, 10
from public.skills where key = 'discipline-2'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'focus-3', 'Estado de flujo', 'Entrás en flow con más facilidad.', 'Waves', 'Enfoque', 'Enfoque', 3, id, 10
from public.skills where key = 'focus-2'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'creativity-3', 'Maestría creativa', 'Tu trabajo creativo alcanza su forma más pulida.', 'Star', 'Creatividad', 'Creatividad', 3, id, 10
from public.skills where key = 'creativity-2'
on conflict (key) do nothing;

insert into public.skills (key, name, description, icon, category, stat_key, cost, requires_skill_id, min_level)
select 'charisma-3', 'Influencia', 'Tu palabra tiene peso real en el grupo.', 'Crown', 'Carisma', 'Carisma', 3, id, 10
from public.skills where key = 'charisma-2'
on conflict (key) do nothing;

-- =========================================================
-- 2. unlock_skill() — valida nivel mínimo, prerrequisito y costo
--    server-side antes de desbloquear.
-- =========================================================

create or replace function public.unlock_skill(p_skill_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_skill record;
    v_level integer;
    v_spent integer;
    v_available integer;
    v_already_unlocked boolean;
    v_prerequisite_unlocked boolean;
begin
    if v_user_id is null then
        raise exception 'No autenticado';
    end if;

    select * into v_skill from public.skills where id = p_skill_id;
    if not found then
        raise exception 'Skill no encontrada';
    end if;

    select exists (
        select 1 from public.user_skills where user_id = v_user_id and skill_id = p_skill_id
    ) into v_already_unlocked;

    if v_already_unlocked then
        raise exception 'Ya desbloqueaste esta skill';
    end if;

    if v_skill.requires_skill_id is not null then
        select exists (
            select 1 from public.user_skills
            where user_id = v_user_id and skill_id = v_skill.requires_skill_id
        ) into v_prerequisite_unlocked;

        if not v_prerequisite_unlocked then
            raise exception 'Todavía no desbloqueaste el requisito de esta skill';
        end if;
    end if;

    select level into v_level from public.profiles where id = v_user_id;

    if v_level < v_skill.min_level then
        raise exception 'Necesitás nivel % para esta skill', v_skill.min_level;
    end if;

    select coalesce(sum(s.cost), 0) into v_spent
    from public.user_skills us
    join public.skills s on s.id = us.skill_id
    where us.user_id = v_user_id;

    v_available := v_level - v_spent;

    if v_available < v_skill.cost then
        raise exception 'No tenés suficientes puntos de habilidad';
    end if;

    insert into public.user_skills (user_id, skill_id) values (v_user_id, p_skill_id);

    return jsonb_build_object(
        'skill_key', v_skill.key,
        'skill_name', v_skill.name,
        'points_remaining', v_available - v_skill.cost
    );
end;
$$;

grant execute on function public.unlock_skill(uuid) to authenticated;
