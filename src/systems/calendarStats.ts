import type { Mission, UserMission } from "../services/missionService";
import type { Habit, HabitCompletion } from "../services/habitService";
import type { PomodoroSession } from "../services/pomodoroService";
import { daysBetween, toDateKey } from "./date";

export interface DayActivity {
    count: number;
    xp: number;
    coins: number;
    focusMinutes: number;
}

// Deriva actividad por día del historial ya cargado (userMissions + missions
// + pomodoroSessions), sin ninguna consulta nueva a Supabase. `count` es
// estrictamente de misiones (así "X misiones" en el detalle del día sigue
// siendo literal); el foco suma XP y minutos aparte.
export function computeDailyActivity(
    missions: Mission[],
    userMissions: UserMission[],
    pomodoroSessions: PomodoroSession[] = [],
    habits: Habit[] = [],
    habitCompletions: HabitCompletion[] = []
): Record<string, DayActivity> {
    const result: Record<string, DayActivity> = {};

    function bucket(dateKey: string): DayActivity {
        return (result[dateKey] ??= { count: 0, xp: 0, coins: 0, focusMinutes: 0 });
    }

    for (const entry of userMissions) {
        const dateKey = toDateKey(new Date(entry.completed_at));
        const mission = missions.find((candidate) => candidate.id === entry.mission_id);
        const day = bucket(dateKey);
        day.count += 1;
        day.xp += mission?.xp_reward ?? 0;
        day.coins += mission?.coin_reward ?? 0;
    }

    for (const entry of habitCompletions) {
        const dateKey = entry.local_date;
        const habit = habits.find((candidate) => candidate.id === entry.habit_id);
        const day = bucket(dateKey);
        day.count += 1;
        day.xp += habit?.xp_reward ?? 0;
        day.coins += habit?.coin_reward ?? 0;
    }

    for (const session of pomodoroSessions) {
        if (session.mode !== "focus" || !session.was_completed) {
            continue;
        }
        const day = bucket(session.local_date);
        day.xp += session.xp_awarded;
        day.focusMinutes += session.actual_minutes ?? 0;
    }

    return result;
}

export type ActivityLevel = 0 | 1 | 2 | 3;

// Basado en XP del día (no solo cantidad de misiones) para que una sesión de
// foco larga cuente tanto como completar varias misiones.
export function getActivityLevel(xp: number): ActivityLevel {
    if (xp <= 0) {
        return 0;
    }
    if (xp < 25) {
        return 1;
    }
    if (xp < 60) {
        return 2;
    }
    return 3;
}

export function countActiveDays(activityByDate: Record<string, DayActivity>): number {
    return Object.keys(activityByDate).length;
}

export function computeAverageXpPerDay(activityByDate: Record<string, DayActivity>): number {
    const days = Object.values(activityByDate);
    if (days.length === 0) {
        return 0;
    }
    const totalXp = days.reduce((sum, day) => sum + day.xp, 0);
    return Math.round(totalXp / days.length);
}

// % de días desde que se creó la cuenta que tuvieron al menos una actividad
// registrada — una medida simple de consistencia general.
export function computeCompletionRate(
    activityByDate: Record<string, DayActivity>,
    accountCreatedAt: Date,
    now: Date = new Date()
): number {
    const daysSinceStart = Math.max(1, daysBetween(toDateKey(accountCreatedAt), toDateKey(now)) + 1);
    const activeDays = countActiveDays(activityByDate);
    return Math.round((activeDays / daysSinceStart) * 100);
}
