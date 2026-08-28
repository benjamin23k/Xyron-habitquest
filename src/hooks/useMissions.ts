import { useEffect, useState } from "react";
import type { CompleteMissionResult, Mission, UserMission } from "../services/missionService";
import {
    completeMission as completeMissionRequest,
    createCustomMission,
    deleteCustomMission,
    fetchMissions,
    fetchUserMissions
} from "../services/missionService";
import { toDateKey } from "../systems/date";

interface UseMissionsResult {
    missions: Mission[];
    userMissions: UserMission[];
    loading: boolean;
    error: string | null;
    isCompletedToday: (missionId: string) => boolean;
    completeMission: (missionId: string) => Promise<CompleteMissionResult>;
    addCustomMission: (ownerUserId: string, title: string, stat: string) => Promise<void>;
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

    function isCompletedToday(missionId: string): boolean {
        const mission = missions.find((candidate) => candidate.id === missionId);
        if (!mission) {
            return false;
        }

        if (mission.frequency === "once") {
            return userMissions.some((entry) => entry.mission_id === missionId);
        }

        const todayKey = toDateKey(new Date());
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

    async function addCustomMission(ownerUserId: string, title: string, stat: string) {
        const mission = await createCustomMission(ownerUserId, title, stat);
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
        isCompletedToday,
        completeMission,
        addCustomMission,
        removeCustomMission
    };
}
