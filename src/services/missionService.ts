import { supabase } from "../lib/supabaseClient";

export interface Mission {
    id: string;
    owner_user_id: string | null;
    title: string;
    description: string | null;
    difficulty: "easy" | "medium" | "hard" | "epic";
    category: string | null;
    stat: string | null;
    stat_reward: number;
    xp_reward: number;
    coin_reward: number;
    frequency: "daily" | "once";
    due_date: string | null;
    status: string;
    created_at: string;
}

export interface UserMission {
    id: string;
    user_id: string;
    // Puede ser null si la misión (personalizada) fue borrada después de completarla:
    // el historial de esa completada se conserva igual (ver supabase/schema.sql).
    mission_id: string | null;
    completed_at: string;
}

export interface CompleteMissionResult {
    xp_gained: number;
    coins_gained: number;
    stat: string | null;
    stat_gained: number;
    old_level: number;
    new_level: number;
    leveled_up: boolean;
    new_xp: number;
}

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

export async function fetchMissions(): Promise<Mission[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("missions")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return data as Mission[];
}

export async function fetchUserMissions(userId: string): Promise<UserMission[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("user_missions")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data as UserMission[];
}

export async function completeMission(missionId: string): Promise<CompleteMissionResult> {
    const client = requireClient();

    const { data, error } = await client.rpc("complete_mission", { p_mission_id: missionId });

    if (error) {
        throw error;
    }

    return data as CompleteMissionResult;
}

export async function createCustomMission(
    ownerUserId: string,
    title: string,
    stat: string
): Promise<Mission> {
    const client = requireClient();

    const { data, error } = await client
        .from("missions")
        .insert({ owner_user_id: ownerUserId, title, stat })
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    return data as Mission;
}

export async function deleteCustomMission(missionId: string): Promise<void> {
    const client = requireClient();

    const { error } = await client.from("missions").delete().eq("id", missionId);

    if (error) {
        throw error;
    }
}
