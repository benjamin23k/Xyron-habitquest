import type { Mission, UserMission } from "../services/missionService";
import { toDateKey } from "./date";

export interface DayActivity {
    count: number;
    xp: number;
    coins: number;
}

// Deriva actividad por día del historial ya cargado (userMissions + missions),
// sin ninguna consulta nueva a Supabase.
export function computeDailyActivity(missions: Mission[], userMissions: UserMission[]): Record<string, DayActivity> {
    const result: Record<string, DayActivity> = {};

    for (const entry of userMissions) {
        const dateKey = toDateKey(new Date(entry.completed_at));
        const mission = missions.find((candidate) => candidate.id === entry.mission_id);

        const existing = result[dateKey] ?? { count: 0, xp: 0, coins: 0 };
        existing.count += 1;
        existing.xp += mission?.xp_reward ?? 0;
        existing.coins += mission?.coin_reward ?? 0;
        result[dateKey] = existing;
    }

    return result;
}

export type ActivityLevel = 0 | 1 | 2 | 3;

export function getActivityLevel(count: number): ActivityLevel {
    if (count <= 0) {
        return 0;
    }
    if (count === 1) {
        return 1;
    }
    if (count === 2) {
        return 2;
    }
    return 3;
}
