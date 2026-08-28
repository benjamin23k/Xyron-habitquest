-- XYRON — Migración a claves de icono de Phosphor
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- 0002_dynamic_attributes.sql. No borra ni toca filas de usuarios más allá
-- de reescribir el valor de texto de la columna `icon` en los 6 atributos
-- base — el resto de cada fila (value, max_value, etc.) queda intacto.
--
-- Contexto: el frontend reemplazó los emoji por la librería de iconos
-- Phosphor (@phosphor-icons/react). `stats.icon` pasa a guardar el nombre
-- de un componente Phosphor (ej. "Barbell") en lugar de un emoji. El
-- frontend sigue soportando el emoji viejo como fallback (systems/iconRegistry.ts
-- + components/ui/IconGlyph.tsx), así que cualquier atributo personalizado
-- creado antes de esta migración sigue renderizando bien sin tocar la DB.

-- =========================================================
-- 1. Reescribir el ícono de los 6 atributos base ya sembrados en cuentas
--    existentes (creadas antes de esta migración).
-- =========================================================

update public.stats set icon = 'Barbell'        where name = 'Fuerza' and is_default = true;
update public.stats set icon = 'Brain'          where name = 'Inteligencia' and is_default = true;
update public.stats set icon = 'ListChecks'     where name = 'Disciplina' and is_default = true;
update public.stats set icon = 'PaintBrush'     where name = 'Creatividad' and is_default = true;
update public.stats set icon = 'Target'         where name = 'Enfoque' and is_default = true;
update public.stats set icon = 'ChatCircleDots' where name = 'Carisma' and is_default = true;

-- =========================================================
-- 2. Nuevo default de columna: cualquier fila futura que no mande `icon`
--    explícito cae en una clave Phosphor válida en lugar del emoji viejo.
-- =========================================================

alter table public.stats alter column icon set default 'Star';

-- =========================================================
-- 3. Trigger de alta de usuario: siembra los 6 atributos base con claves
--    Phosphor para cuentas nuevas.
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
