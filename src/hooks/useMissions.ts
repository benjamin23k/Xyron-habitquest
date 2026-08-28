import { useEffect, useState } from "react";
import type { CompleteMissionResult, Mission, NewMissionInput, UserMission } from "../services/missionService";
import {
    completeMission as completeMissionRequest,
    createCustomMission,
    deleteCustomMission,
    fetchMissions,
    fetchUserMissions
} from "../services/missionService";
import { startOfWeek, toDateKey } from "../systems/date";

interface UseMissionsResult {
    missions: Mission[];
    userMissions: UserMission[];
    loading: boolean;
    error: string | null;
    isCompletedInCurrentPeriod: (missionId: string) => boolean;
    completeMission: (missionId: string) => Promise<CompleteMissionResult>;
    addCustomMission: (ownerUserId: string, input: NewMissionInput) => Promise<void>;
    removeCustomMission: (missionId: string) => Promise<void>;
}

export function useMissions(userId: string | null): UseMissionsResult {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [userMissions, setUserMissions] = useState<UserMission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Misma bandera de cancelación que useProfile: evita que una carga vieja
        // (p. ej. la primera de las dos invocaciones que hace StrictMode) pise el
        // estado de una carga más nueva que ya resolvió.
        let ignore = false;

        async function load() {
            if (!userId) {
                setMissions([]);
                setUserMissions([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [missionsData, userMissionsData] = await Promise.all([
                    fetchMissions(),
                    fetchUserMissions(userId)
                ]);

                if (!ignore) {
                    setMissions(missionsData);
                    setUserMissions(userMissionsData);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "No se pudieron cargar las misiones.");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            ignore = true;
        };
    }, [userId]);

    // Refleja si el período de repetición actual de la misión ya se completó
    // (día/semana/mes local, o "alguna vez" para once/challenge) — solo para
    // deshabilitar el botón al instante; la fuente de verdad real es
    // complete_mission() en Supabase, que decide con el mismo criterio.
    function isCompletedInCurrentPeriod(missionId: string): boolean {
        const mission = missions.find((candidate) => candidate.id === missionId);
        if (!mission) {
            return false;
        }

        if (mission.frequency === "once" || mission.frequency === "challenge") {
            return userMissions.some((entry) => entry.mission_id === missionId);
        }

        const now = new Date();

        if (mission.frequency === "weekly") {
            const currentWeekStart = startOfWeek(now);
            return userMissions.some(
                (entry) => entry.mission_id === missionId && startOfWeek(new Date(entry.completed_at)) === currentWeekStart
            );
        }

        if (mission.frequency === "monthly") {
            return userMissions.some((entry) => {
                if (entry.mission_id !== missionId) {
                    return false;
                }
                const completedDate = new Date(entry.completed_at);
                return completedDate.getFullYear() === now.getFullYear() && completedDate.getMonth() === now.getMonth();
            });
        }

        const todayKey = toDateKey(now);
        return userMissions.some(
            (entry) => entry.mission_id === missionId && toDateKey(new Date(entry.completed_at)) === todayKey
        );
    }

    async function completeMission(missionId: string): Promise<CompleteMissionResult> {
        const result = await completeMissionRequest(missionId);

        setUserMissions((prev) => [
            {
                id: crypto.randomUUID(),
                user_id: userId ?? "",
                mission_id: missionId,
                completed_at: new Date().toISOString()
            },
            ...prev
        ]);

        return result;
    }

    async function addCustomMission(ownerUserId: string, input: NewMissionInput) {
        const mission = await createCustomMission(ownerUserId, input);
        setMissions((prev) => [...prev, mission]);
    }

    async function removeCustomMission(missionId: string) {
        await deleteCustomMission(missionId);
        setMissions((prev) => prev.filter((mission) => mission.id !== missionId));
    }

    return {
        missions,
        userMissions,
        loading,
        error,
        isCompletedInCurrentPeriod,
        completeMission,
        addCustomMission,
        removeCustomMission
    };
}
