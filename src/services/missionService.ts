import { supabase } from "../lib/supabaseClient";

export type MissionDifficulty = "easy" | "medium" | "hard" | "epic" | "legendary";
export type MissionFrequency = "daily" | "weekly" | "monthly" | "once" | "challenge";

export interface Mission {
    id: string;
    owner_user_id: string | null;
    title: string;
    description: string | null;
    difficulty: MissionDifficulty;
    category: string | null;
    stat: string | null;
    stat_reward: number;
    xp_reward: number;
    coin_reward: number;
    frequency: MissionFrequency;
    due_date: string | null;
    estimated_minutes: number | null;
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

export interface NewMissionInput {
    title: string;
    description: string;
    category: string;
    stat: string;
    difficulty: MissionDifficulty;
    frequency: MissionFrequency;
    dueDate: string | null;
    estimatedMinutes: number | null;
}

export async function createCustomMission(ownerUserId: string, input: NewMissionInput): Promise<Mission> {
    const client = requireClient();

    // xp_reward/coin_reward no se mandan: no tienen privilegio de columna
    // (los fija el trigger fn_apply_difficulty_rewards a partir de la
    // dificultad elegida — ver supabase/migrations/0007_quest_system_upgrade.sql).
    const { data, error } = await client
        .from("missions")
        .insert({
            owner_user_id: ownerUserId,
            title: input.title,
            description: input.description || null,
            category: input.category || null,
            stat: input.stat,
            difficulty: input.difficulty,
            frequency: input.frequency,
            due_date: input.dueDate,
            estimated_minutes: input.estimatedMinutes
        })
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
