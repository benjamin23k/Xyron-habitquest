import type { Mission } from "../services/missionService";
import type { UserMission } from "../services/missionService";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Cuánto subió cada atributo (por nombre) en los últimos 7 días, derivado del
// historial de misiones ya cargado — no dispara ninguna consulta nueva a
// Supabase. Funciona con cualquier atributo, no solo los 6 predeterminados.
export function computeWeeklyGainByStat(
    missions: Mission[],
    userMissions: UserMission[],
    now: Date = new Date()
): Record<string, number> {
    const cutoff = now.getTime() - WEEK_MS;
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

    return gains;
}
