import { supabase } from "../lib/supabaseClient";

export interface Profile {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    level: number;
    xp: number;
    coins: number;
    rank: string;
    membership: string;
    active_title_id: string | null;
    timezone_offset_minutes: number;
    created_at: string;
}

export interface StatRow {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    icon: string;
    value: number;
    max_value: number;
    is_default: boolean;
    in_radar: boolean;
    created_at: string;
}

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

export async function fetchProfile(userId: string): Promise<Profile> {
    const client = requireClient();

    const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        throw error;
    }

    return data as Profile;
}

export interface ProfileUpdate {
    name?: string;
    username?: string;
    avatar_url?: string;
    active_title_id?: string | null;
    timezone_offset_minutes?: number;
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    const client = requireClient();

    const { data, error } = await client
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select("*")
        .single();

    if (error) {
        // 42501 = row-level security violation: pasa si se intenta activar un
        // título que el usuario todavía no desbloqueó (ver policy
        // "profiles_update_own" en supabase/migrations/0004_progression_foundation.sql).
        if (error.code === "42501") {
            throw new Error("Todavía no desbloqueaste ese título.");
        }
        throw error;
    }

    return data as Profile;
}

export async function fetchStats(userId: string): Promise<StatRow[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("stats")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return data as StatRow[];
}

export interface NewStatInput {
    name: string;
    description: string;
    icon: string;
    maxValue: number;
}

export async function addCustomStat(userId: string, input: NewStatInput): Promise<StatRow> {
    const client = requireClient();

    // value/is_default no se mandan: la DB no le da privilegio de columna a
    // "authenticated" sobre esos campos, así que siempre caen en el DEFAULT
    // (0 y false) sin importar qué se intente enviar (ver
    // supabase/migrations/0002_dynamic_attributes.sql).
    const { data, error } = await client
        .from("stats")
        .insert({
            user_id: userId,
            name: input.name,
            description: input.description || null,
            icon: input.icon || "⭐",
            max_value: input.maxValue
        })
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    return data as StatRow;
}

export interface StatUpdateInput {
    name?: string;
    description?: string | null;
    icon?: string;
    max_value?: number;
    in_radar?: boolean;
}

export async function updateStat(statId: string, updates: StatUpdateInput): Promise<StatRow> {
    const client = requireClient();

    const { data, error } = await client
        .from("stats")
        .update(updates)
        .eq("id", statId)
        .select("*")
        .single();

    if (error) {
        // 23514 = check_violation: el nuevo max_value quedó por debajo del
        // progreso ya acumulado (ver constraint stats_value_within_max).
        if (error.code === "23514") {
            throw new Error("El valor máximo no puede ser menor a tu progreso actual en este atributo.");
        }
        throw error;
    }

    return data as StatRow;
}

export async function deleteStat(statId: string): Promise<void> {
    const client = requireClient();

    // RLS también exige is_default = false: si esto es un atributo base, la
    // policy lo bloquea aunque alguien intente llamar esto directo.
    const { error } = await client.from("stats").delete().eq("id", statId);

    if (error) {
        throw error;
    }
}
