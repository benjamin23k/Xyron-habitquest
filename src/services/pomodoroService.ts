import { supabase } from "../lib/supabaseClient";

export type PomodoroMode = "focus" | "short_break" | "long_break";

export interface PomodoroSession {
    id: string;
    user_id: string;
    mode: PomodoroMode;
    duration_minutes: number;
    actual_minutes: number | null;
    stat: string | null;
    mission_id: string | null;
    xp_awarded: number;
    was_completed: boolean;
    local_date: string;
    started_at: string;
    completed_at: string | null;
    created_at: string;
}

export interface CompletePomodoroResult {
    was_completed: boolean;
    xp_gained: number;
    coins_gained: number;
    stat: string | null;
    stat_gained: number;
    old_level: number;
    new_level: number;
    leveled_up: boolean;
    new_xp: number;
    bonus_applied: boolean;
}

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

export async function fetchPomodoroSessions(userId: string): Promise<PomodoroSession[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data as PomodoroSession[];
}

// started_at lo fija el servidor (now()), nunca el timestamp del navegador —
// ver supabase/migrations/0009_pomodoro.sql.
export async function startPomodoroSession(
    mode: PomodoroMode,
    durationMinutes: number,
    stat: string | null,
    missionId: string | null
): Promise<string> {
    const client = requireClient();

    const { data, error } = await client.rpc("start_pomodoro_session", {
        p_mode: mode,
        p_duration_minutes: durationMinutes,
        p_stat: stat,
        p_mission_id: missionId
    });

    if (error) {
        throw error;
    }

    return data as string;
}

export async function completePomodoroSession(sessionId: string): Promise<CompletePomodoroResult> {
    const client = requireClient();

    const { data, error } = await client.rpc("complete_pomodoro_session", { p_session_id: sessionId });

    if (error) {
        throw error;
    }

    return data as CompletePomodoroResult;
}

export async function stopPomodoroSession(sessionId: string): Promise<void> {
    const client = requireClient();

    const { error } = await client.rpc("stop_pomodoro_session", { p_session_id: sessionId });

    if (error) {
        throw error;
    }
}
