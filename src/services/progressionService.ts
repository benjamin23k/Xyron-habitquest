import { supabase } from "../lib/supabaseClient";

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface AchievementRow {
    id: string;
    key: string;
    name: string;
    description: string;
    category: string;
    rarity: Rarity;
    requirement_type: string;
    requirement_value: number;
    xp_reward: number;
    icon: string;
    is_hidden: boolean;
}

export interface UserAchievementRow {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: string;
}

export interface TitleRow {
    id: string;
    key: string;
    name: string;
    description: string;
    requirement_type: string;
    requirement_value: number;
    rarity: Rarity;
}

export interface UserTitleRow {
    id: string;
    user_id: string;
    title_id: string;
    unlocked_at: string;
}

export interface SyncProgressionResult {
    unlocked_achievements: string[];
    unlocked_titles: string[];
    xp_awarded: number;
}

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

export async function fetchAchievements(): Promise<AchievementRow[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

    if (error) {
        throw error;
    }

    return data as AchievementRow[];
}

export async function fetchUserAchievements(userId: string): Promise<UserAchievementRow[]> {
    const client = requireClient();

    const { data, error } = await client.from("user_achievements").select("*").eq("user_id", userId);

    if (error) {
        throw error;
    }

    return data as UserAchievementRow[];
}

export async function fetchTitles(): Promise<TitleRow[]> {
    const client = requireClient();

    const { data, error } = await client.from("titles").select("*").order("requirement_value", { ascending: true });

    if (error) {
        throw error;
    }

    return data as TitleRow[];
}

export async function fetchUserTitles(userId: string): Promise<UserTitleRow[]> {
    const client = requireClient();

    const { data, error } = await client.from("user_titles").select("*").eq("user_id", userId);

    if (error) {
        throw error;
    }

    return data as UserTitleRow[];
}

// Reevalúa logros y títulos server-side contra el estado real del usuario y
// desbloquea lo que corresponda (RPC SECURITY DEFINER — ver
// supabase/migrations/0004_progression_foundation.sql). Devuelve solo las
// claves nuevas: el llamador ya tiene el catálogo cargado y puede resolverlas
// sin pedir de nuevo user_achievements/user_titles.
export async function syncProgression(): Promise<SyncProgressionResult> {
    const client = requireClient();

    const { data, error } = await client.rpc("sync_progression");

    if (error) {
        throw error;
    }

    return data as SyncProgressionResult;
}
