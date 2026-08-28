import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import DashboardSkeleton from "./DashboardSkeleton";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useMissions } from "../../hooks/useMissions";
import { useToast } from "../ui/Toast";
import { signOut } from "../../services/authService";
import type { Mission } from "../../services/missionService";
import type { Quest } from "../../data/quests";
import type { Stat } from "../../data/character";
import type { QuestLogEntry } from "../../systems/questLog";
import achievementsList from "../../data/achievements";
import { getProgression } from "../../systems/progression";
import { computeStreakFromDates } from "../../systems/streak";
import { getUnlockedAchievementIds } from "../../systems/achievements";
import { computeWeeklyGainByStat } from "../../systems/statProgress";
import { toDateKey } from "../../systems/date";
import type { DashboardContextValue } from "./DashboardContext";
import "../../styles/app.css";

const MAX_RADAR_ATTRIBUTES = 8;

function missionToQuest(mission: Mission): Quest {
    return {
        id: mission.id,
        title: mission.title,
        description: mission.description ?? undefined,
        stat: mission.stat ?? "",
        statReward: mission.stat_reward,
        xpReward: mission.xp_reward,
        coinReward: mission.coin_reward,
        difficulty: mission.difficulty
    };
}

function achievementsStorageKey(userId: string): string {
    return `xyron:unlockedAchievements:${userId}`;
}

function loadUnlockedAchievementIds(userId: string): string[] {
    try {
        const raw = localStorage.getItem(achievementsStorageKey(userId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function AppLayout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const { push } = useToast();

    const {
        profile,
        stats,
        loading: profileLoading,
        error: profileError,
        addStat,
        editStat,
        removeStat,
        editProfile,
        applyMissionReward
    } = useProfile(userId);

    const {
        missions,
        userMissions,
        loading: missionsLoading,
        error: missionsError,
        isCompletedToday,
        completeMission,
        addCustomMission,
        removeCustomMission
    } = useMissions(userId);

    const [achievementsLoadedForUserId, setAchievementsLoadedForUserId] = useState(userId);
    const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<string[]>(() =>
        userId ? loadUnlockedAchievementIds(userId) : []
    );
    const [actionError, setActionError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const previousAchievementIds = useRef<string[]>(unlockedAchievementIds);

    // Ajuste durante el render (no en un efecto): si cambia la cuenta logueada,
    // recarga los logros de ESA cuenta antes de pintar.
    if (userId !== achievementsLoadedForUserId) {
        setAchievementsLoadedForUserId(userId);
        setUnlockedAchievementIds(userId ? loadUnlockedAchievementIds(userId) : []);
    }

    useEffect(() => {
        if (userId) {
            localStorage.setItem(achievementsStorageKey(userId), JSON.stringify(unlockedAchievementIds));
        }
    }, [userId, unlockedAchievementIds]);

    // Este sí es un efecto legítimo: dispara un toast (un sistema externo a este
    // componente) cuando aparecen ids de logro nuevos, comparando contra la
    // última lista vista en un ref (no dispara renders extra).
    useEffect(() => {
        const newIds = unlockedAchievementIds.filter((id) => !previousAchievementIds.current.includes(id));
        previousAchievementIds.current = unlockedAchievementIds;

        for (const id of newIds) {
            const achievement = achievementsList.find((item) => item.id === id);
            if (achievement) {
                push({ kind: "achievement", title: achievement.title, lines: [achievement.description] });
            }
        }
    }, [unlockedAchievementIds, push]);

    async function handleCompleteMission(missionId: string) {
        setActionError(null);

        try {
            const result = await completeMission(missionId);
            applyMissionReward(result);

            const lines = [`+${result.coins_gained} XYR`];
            if (result.stat) {
                lines.push(`+${result.stat_gained} ${result.stat}`);
            }
            push({ kind: "mission", title: `+${result.xp_gained} XP`, lines });

            if (result.leveled_up) {
                push({ kind: "levelup", title: `Nivel ${result.new_level}` });
            }
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo completar la misión.");
        }
    }

    async function handleAddCustomMission(title: string, stat: string) {
        if (!userId) {
            return;
        }

        setActionError(null);

        try {
            await addCustomMission(userId, title, stat);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo crear la misión.");
        }
    }

    async function handleRemoveCustomMission(missionId: string) {
        setActionError(null);

        try {
            await removeCustomMission(missionId);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo eliminar la misión.");
        }
    }

    async function handleAddStat(values: Parameters<typeof addStat>[0]) {
        setActionError(null);

        try {
            await addStat(values);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo crear el atributo.");
            throw err;
        }
    }

    async function handleEditStat(statId: string, updates: Parameters<typeof editStat>[1]) {
        setActionError(null);

        try {
            await editStat(statId, updates);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo editar el atributo.");
            throw err;
        }
    }

    async function handleDeleteStat(statId: string) {
        setActionError(null);

        try {
            await removeStat(statId);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo eliminar el atributo.");
            throw err;
        }
    }

    async function handleEditProfile(updates: Parameters<typeof editProfile>[0]) {
        setActionError(null);

        try {
            await editProfile(updates);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo guardar el perfil.");
            throw err;
        }
    }

    async function handleLogout() {
        await signOut();
        navigate("/login");
    }

    if (!userId || profileLoading || missionsLoading || !profile) {
        return <DashboardSkeleton />;
    }

    const displayStats: Stat[] = stats.map((stat) => ({
        name: stat.name,
        value: stat.value,
        maxValue: stat.max_value
    }));

    const radarStats: Stat[] = stats
        .filter((stat) => stat.in_radar)
        .slice(0, MAX_RADAR_ATTRIBUTES)
        .map((stat) => ({ name: stat.name, value: stat.value, maxValue: stat.max_value }));

    const weeklyGains = computeWeeklyGainByStat(missions, userMissions);

    const dailyQuests = missions.filter((mission) => mission.owner_user_id === null).map(missionToQuest);
    const customQuests = missions.filter((mission) => mission.owner_user_id === userId).map(missionToQuest);

    const questLog: QuestLogEntry[] = userMissions.map((entry) => {
        const completedDate = new Date(entry.completed_at);
        return {
            questId: entry.mission_id ?? entry.id,
            dateKey: toDateKey(completedDate),
            completedAt: completedDate.getTime()
        };
    });

    const streak = computeStreakFromDates(questLog.map((entry) => entry.dateKey));
    const progression = getProgression(profile.xp);

    const completedQuestCount = new Set(
        userMissions.map((entry) => entry.mission_id).filter((missionId): missionId is string => missionId !== null)
    ).size;

    // Derivado durante el render: si el progreso actual satisface logros que
    // todavía no están en la lista persistida, se fusionan de inmediato.
    const newlyUnlockedAchievementIds = getUnlockedAchievementIds({
        completedQuestCount,
        totalQuestCount: missions.length,
        streak: streak.current,
        level: progression.level,
        stats: displayStats
    });

    if (newlyUnlockedAchievementIds.some((id) => !unlockedAchievementIds.includes(id))) {
        setUnlockedAchievementIds((prev) => Array.from(new Set([...prev, ...newlyUnlockedAchievementIds])));
    }

    const contextValue: DashboardContextValue = {
        userId,
        profile,
        stats,
        displayStats,
        radarStats,
        weeklyGains,
        missions,
        userMissions,
        dailyQuests,
        customQuests,
        questLog,
        streak,
        progression,
        unlockedAchievementIds,
        isCompletedToday,
        completeMission: handleCompleteMission,
        addCustomMission: handleAddCustomMission,
        removeCustomMission: handleRemoveCustomMission,
        addStat: handleAddStat,
        editStat: handleEditStat,
        removeStat: handleDeleteStat,
        editProfile: handleEditProfile
    };

    return (
        <div className="app-shell">
            <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

            <div className="app-shell-main">
                <Topbar
                    level={progression.level}
                    streakDays={streak.current}
                    coins={profile.coins}
                    playerName={profile.name}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                    onLogout={handleLogout}
                />

                <main className="app-content">
                    {(actionError || profileError || missionsError) && (
                        <p className="dashboard-error" role="alert">
                            {actionError || profileError || missionsError}
                        </p>
                    )}

                    <Outlet context={contextValue} />
                </main>

                <BottomNav />
            </div>
        </div>
    );
}

export default AppLayout;
