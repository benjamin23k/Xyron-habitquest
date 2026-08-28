import type { Mission } from "../services/missionService";
import type { UserMission } from "../services/missionService";
import type { Habit, HabitCompletion } from "../services/habitService";

// Cuánto subió cada atributo (por nombre) en los últimos 7 días, derivado del
// historial de misiones (y hábitos) ya cargado — no dispara ninguna consulta
// nueva a Supabase. Funciona con cualquier atributo, no solo los 6
// predeterminados.
export function computeWeeklyGainByStat(
    missions: Mission[],
    userMissions: UserMission[],
    now: Date = new Date(),
    habits: Habit[] = [],
    habitCompletions: HabitCompletion[] = []
): Record<string, number> {
    return computeStatGainInRange(missions, userMissions, 7, now, habits, habitCompletions);
}

// Igual que computeWeeklyGainByStat pero con un rango de días configurable —
// lo usa Analytics para "evolución de stats" en 7/30/90/365 días sin
// duplicar la lógica de agregación.
export function computeStatGainInRange(
    missions: Mission[],
    userMissions: UserMission[],
    rangeDays: number,
    now: Date = new Date(),
    habits: Habit[] = [],
    habitCompletions: HabitCompletion[] = []
): Record<string, number> {
    const cutoff = now.getTime() - rangeDays * 24 * 60 * 60 * 1000;
    const gains: Record<string, number> = {};

    for (const entry of userMissions) {
        if (new Date(entry.completed_at).getTime() < cutoff) {
            continue;
        }

        const mission = missions.find((candidate) => candidate.id === entry.mission_id);
        if (!mission || !mission.stat) {
            continue;
        }

        gains[mission.stat] = (gains[mission.stat] ?? 0) + mission.stat_reward;
    }

    for (const entry of habitCompletions) {
        if (new Date(entry.completed_at).getTime() < cutoff) {
            continue;
        }

        const habit = habits.find((candidate) => candidate.id === entry.habit_id);
        if (!habit || !habit.stat) {
            continue;
        }

        gains[habit.stat] = (gains[habit.stat] ?? 0) + habit.stat_reward;
    }

    return gains;
}
