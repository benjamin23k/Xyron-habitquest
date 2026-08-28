import { supabase } from "../lib/supabaseClient";
import type { CompleteMissionResult } from "./missionService";

export type HabitFrequency = "daily" | "weekly";

export interface Habit {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    icon: string | null;
    category: string | null;
    stat: string | null;
    stat_reward: number;
    xp_reward: number;
    coin_reward: number;
    frequency: HabitFrequency;
    status: string;
    created_at: string;
}

export interface HabitCompletion {
    id: string;
    user_id: string;
    // Puede ser null si el hábito fue borrado después de completarlo — el
    // historial de esa completada se conserva igual (ver supabase/migrations/0012_habits.sql).
    habit_id: string | null;
    completed_at: string;
    local_date: string;
}

// complete_habit() devuelve exactamente el mismo shape que complete_mission():
// se reutiliza el tipo para poder pasarle el resultado a applyMissionReward
// sin duplicar la interfaz.
export type CompleteHabitResult = CompleteMissionResult;

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

export async function fetchHabits(userId: string): Promise<Habit[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return data as Habit[];
}

export async function fetchHabitCompletions(userId: string): Promise<HabitCompletion[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data as HabitCompletion[];
}

export async function completeHabit(habitId: string): Promise<CompleteHabitResult> {
    const client = requireClient();

    const { data, error } = await client.rpc("complete_habit", { p_habit_id: habitId });

    if (error) {
        throw error;
    }

    return data as CompleteHabitResult;
}

export interface NewHabitInput {
    title: string;
    description: string;
    icon: string;
    category: string;
    stat: string;
    frequency: HabitFrequency;
}

export async function createHabit(ownerUserId: string, input: NewHabitInput): Promise<Habit> {
    const client = requireClient();

    // xp_reward/coin_reward/stat_reward no se mandan: no tienen privilegio de
    // columna (caen en los DEFAULT de la tabla — ver 0012_habits.sql).
    const { data, error } = await client
        .from("habits")
        .insert({
            user_id: ownerUserId,
            title: input.title,
            description: input.description || null,
            icon: input.icon || null,
            category: input.category || null,
            stat: input.stat,
            frequency: input.frequency
        })
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    return data as Habit;
}

export async function deleteHabit(habitId: string): Promise<void> {
    const client = requireClient();

    const { error } = await client.from("habits").delete().eq("id", habitId);

    if (error) {
        throw error;
    }
}
