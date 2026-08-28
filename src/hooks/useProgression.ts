import { useEffect, useState } from "react";
import type {
    AchievementRow,
    SyncProgressionResult,
    TitleRow,
    UserAchievementRow,
    UserTitleRow
} from "../services/progressionService";
import {
    fetchAchievements,
    fetchTitles,
    fetchUserAchievements,
    fetchUserTitles,
    syncProgression
} from "../services/progressionService";

interface UseProgressionResult {
    achievements: AchievementRow[];
    userAchievements: UserAchievementRow[];
    unlockedAchievementIds: Set<string>;
    titles: TitleRow[];
    userTitles: UserTitleRow[];
    unlockedTitleIds: Set<string>;
    loading: boolean;
    error: string | null;
    sync: () => Promise<SyncProgressionResult>;
}

export function useProgression(userId: string | null): UseProgressionResult {
    const [achievements, setAchievements] = useState<AchievementRow[]>([]);
    const [userAchievements, setUserAchievements] = useState<UserAchievementRow[]>([]);
    const [titles, setTitles] = useState<TitleRow[]>([]);
    const [userTitles, setUserTitles] = useState<UserTitleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Mismo patrón de cancelación que useProfile/useMissions: una carga
        // vieja no debe pisar el estado de una más nueva.
        let ignore = false;

        async function load() {
            if (!userId) {
                setAchievements([]);
                setUserAchievements([]);
                setTitles([]);
                setUserTitles([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [achievementsData, userAchievementsData, titlesData, userTitlesData] = await Promise.all([
                    fetchAchievements(),
                    fetchUserAchievements(userId),
                    fetchTitles(),
                    fetchUserTitles(userId)
                ]);

                if (!ignore) {
                    setAchievements(achievementsData);
                    setUserAchievements(userAchievementsData);
                    setTitles(titlesData);
                    setUserTitles(userTitlesData);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "No se pudo cargar el progreso.");
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

    // Aplica el resultado de sync_progression() sin volver a pedir
    // user_achievements/user_titles enteros: el catálogo ya está en memoria,
    // solo hace falta resolver qué claves nuevas vinieron.
    async function sync(): Promise<SyncProgressionResult> {
        const result = await syncProgression();

        if (result.unlocked_achievements.length > 0) {
            setUserAchievements((prev) => {
                const already = new Set(prev.map((entry) => entry.achievement_id));
                const newEntries = achievements
                    .filter((item) => result.unlocked_achievements.includes(item.key) && !already.has(item.id))
                    .map((item) => ({
                        id: crypto.randomUUID(),
                        user_id: userId ?? "",
                        achievement_id: item.id,
                        unlocked_at: new Date().toISOString()
                    }));
                return [...prev, ...newEntries];
            });
        }

        if (result.unlocked_titles.length > 0) {
            setUserTitles((prev) => {
                const already = new Set(prev.map((entry) => entry.title_id));
                const newEntries = titles
                    .filter((item) => result.unlocked_titles.includes(item.key) && !already.has(item.id))
                    .map((item) => ({
                        id: crypto.randomUUID(),
                        user_id: userId ?? "",
                        title_id: item.id,
                        unlocked_at: new Date().toISOString()
                    }));
                return [...prev, ...newEntries];
            });
        }

        return result;
    }

    const unlockedAchievementIds = new Set(userAchievements.map((entry) => entry.achievement_id));
    const unlockedTitleIds = new Set(userTitles.map((entry) => entry.title_id));

    return {
        achievements,
        userAchievements,
        unlockedAchievementIds,
        titles,
        userTitles,
        unlockedTitleIds,
        loading,
        error,
        sync
    };
}
