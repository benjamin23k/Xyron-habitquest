-- XYRON — Atributos dinámicos y personalizados
-- Migración INCREMENTAL: ejecutar en el SQL Editor de Supabase DESPUÉS de
-- supabase/schema.sql. No borra ni toca datos existentes de usuarios — solo
-- agrega columnas nuevas (con DEFAULT) y ajusta privilegios/policies.

-- =========================================================
-- 1. Columnas nuevas en stats
-- =========================================================

alter table public.stats
    add column if not exists description text,
    add column if not exists icon text not null default '⭐',
    add column if not exists is_default boolean not null default false,
    add column if not exists in_radar boolean not null default true;

-- Nunca dejar un atributo con más progreso del que su propio máximo permite
-- (protege contra bajar max_value por debajo del value actual sin darse cuenta).
-- Nota: a diferencia de ADD COLUMN, Postgres no soporta "IF NOT EXISTS" acá;
-- este archivo está pensado para correrse una única vez.
alter table public.stats
    add constraint stats_value_within_max check (value <= max_value);

-- =========================================================
-- 2. Marcar como "is_default" + poner ícono a los 6 atributos base que ya
--    existan en cuentas creadas antes de esta migración.
-- =========================================================

update public.stats set is_default = true, icon = '💪' where name = 'Fuerza' and is_default = false;
update public.stats set is_default = true, icon = '🧠' where name = 'Inteligencia' and is_default = false;
update public.stats set is_default = true, icon = '🎯' where name = 'Disciplina' and is_default = false;
update public.stats set is_default = true, icon = '🎨' where name = 'Creatividad' and is_default = false;
update public.stats set is_default = true, icon = '🔍' where name = 'Enfoque' and is_default = false;
update public.stats set is_default = true, icon = '🗣️' where name = 'Carisma' and is_default = false;

-- =========================================================
-- 3. Trigger de alta de usuario: ahora siembra ícono + is_default = true
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
        (new.id, 'Fuerza', 0, 10, '💪', true, true),
        (new.id, 'Inteligencia', 0, 10, '🧠', true, true),
        (new.id, 'Disciplina', 0, 10, '🎯', true, true),
        (new.id, 'Creatividad', 0, 10, '🎨', true, true),
        (new.id, 'Enfoque', 0, 10, '🔍', true, true),
        (new.id, 'Carisma', 0, 10, '🗣️', true, true)
    on conflict (user_id, name) do nothing;

    return new;
end;
$$;

-- =========================================================
-- 4. Privilegios de columna: crear/editar atributos propios sin poder
--    tocar value ni is_default desde el navegador.
-- =========================================================

revoke insert, update, delete on public.stats from authenticated;

-- Crear: el usuario fija nombre/descripción/ícono/máximo. value e is_default
-- quedan afuera del GRANT -> siempre caen en sus DEFAULT (0 y false) sin
-- importar qué mande el cliente.
grant insert (user_id, name, description, icon, max_value) on public.stats to authenticated;

-- Editar: mismo criterio. value/is_default siguen sin privilegio de columna,
-- así que ni un UPDATE directo a la API puede tocarlos — solo complete_mission()
-- (SECURITY DEFINER) escribe en "value". in_radar se puede togglear en
-- cualquier atributo (propio o base) porque es solo una preferencia visual.
grant update (name, description, icon, max_value, in_radar) on public.stats to authenticated;

grant delete on public.stats to authenticated;

-- =========================================================
-- 5. Policies: update permitido en toda fila propia (protegido por columna,
--    ver arriba); delete SOLO en atributos personalizados — un atributo base
--    no se puede borrar ni con una llamada directa a la API.
-- =========================================================

drop policy if exists "stats_update_own" on public.stats;
create policy "stats_update_own"
    on public.stats for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists "stats_delete_own_custom" on public.stats;
create policy "stats_delete_own_custom"
    on public.stats for delete
    using (user_id = auth.uid() and is_default = false);
