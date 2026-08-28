import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import DashboardSkeleton from "./DashboardSkeleton";
import LevelUpOverlay from "../dashboard/LevelUpOverlay";
import CommandPalette from "./CommandPalette";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { useMissions } from "../../hooks/useMissions";
import { useHabits } from "../../hooks/useHabits";
import { useProgression } from "../../hooks/useProgression";
import { useSkills } from "../../hooks/useSkills";
import { usePomodoroSessions } from "../../hooks/usePomodoroSessions";
import { usePomodoroTimer } from "../../hooks/usePomodoroTimer";
import { useXpTransactions } from "../../hooks/useXpTransactions";
import { useNotifications } from "../../hooks/useNotifications";
import { useToast } from "../ui/Toast";
import type { ToastInput } from "../ui/Toast";
import { signOut } from "../../services/authService";
import type { Mission, NewMissionInput } from "../../services/missionService";
import type { NewHabitInput } from "../../services/habitService";
import type { PomodoroMode } from "../../services/pomodoroService";
import { completePomodoroSession, stopPomodoroSession } from "../../services/pomodoroService";
import type { Quest } from "../../data/quests";
import type { Stat } from "../../data/character";
import type { QuestLogEntry } from "../../systems/questLog";
import { getProgression } from "../../systems/progression";
import { computeStreakFromDates } from "../../systems/streak";
import { computeWeeklyGainByStat } from "../../systems/statProgress";
import { toDateKey } from "../../systems/date";
import type { ActiveTimer } from "../../systems/pomodoroTimer";
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
        difficulty: mission.difficulty,
        frequency: mission.frequency,
        dueDate: mission.due_date ?? undefined,
        estimatedMinutes: mission.estimated_minutes ?? undefined
    };
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
        isCompletedInCurrentPeriod,
        completeMission,
        addCustomMission,
        removeCustomMission
    } = useMissions(userId);

    const {
        habits,
        habitCompletions,
        loading: habitsLoading,
        error: habitsError,
        isCompletedInCurrentPeriod: isHabitCompletedInCurrentPeriod,
        completeHabit,
        addHabit,
        removeHabit
    } = useHabits(userId);

    const {
        achievements,
        userAchievements,
        unlockedAchievementIds,
        titles,
        userTitles,
        unlockedTitleIds,
        sync: syncProgression
    } = useProgression(userId);

    const {
        skills,
        userSkills,
        unlockedSkillIds,
        error: skillsError,
        unlock: unlockSkill
    } = useSkills(userId);

    const {
        sessions: pomodoroSessions,
        error: pomodoroSessionsError,
        addSession: addPomodoroSession
    } = usePomodoroSessions(userId);

    const { xpTransactions } = useXpTransactions(userId);

    const {
        notifications,
        unreadCount,
        notify: logNotification,
        markRead: markNotificationRead,
        markAllRead: markAllNotificationsRead
    } = useNotifications(userId);

    const [actionError, setActionError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [levelUp, setLevelUp] = useState<{ from: number; to: number } | null>(null);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const syncedOnMountFor = useRef<string | null>(null);

    // Ctrl+K / Cmd+K abre el command palette desde cualquier página.
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setPaletteOpen((prev) => !prev);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Un solo punto de entrada para "avisarle algo al usuario": muestra el
    // toast de siempre Y deja un registro persistente en la campana de
    // notificaciones — así ambos sistemas nunca se desincronizan.
    function notify(input: ToastInput) {
        push(input);
        logNotification({ kind: input.kind, title: input.title, body: input.lines?.join(" · ") ?? null });
    }

    // Dispara la experiencia especial de subida de nivel (además del toast
    // normal) — la usan tanto completar una misión como cerrar una sesión de
    // foco, cualquier camino que otorgue XP.
    function maybeShowLevelUp(result: { leveled_up: boolean; old_level: number; new_level: number }) {
        if (result.leveled_up) {
            setLevelUp({ from: result.old_level, to: result.new_level });
        }
    }

    // Anuncia (vía toast) los logros/títulos que trajo un sync_progression()
    // recién resuelto, buscando su nombre en el catálogo ya cargado.
    function announceUnlocks(result: { unlocked_achievements: string[]; unlocked_titles: string[] }) {
        for (const key of result.unlocked_achievements) {
            const achievement = achievements.find((item) => item.key === key);
            if (achievement) {
                notify({ kind: "achievement", title: achievement.name, lines: [achievement.description] });
            }
        }

        for (const key of result.unlocked_titles) {
            const title = titles.find((item) => item.key === key);
            if (title) {
                notify({ kind: "title", title: title.name, lines: ["Nuevo título disponible en tu perfil."] });
            }
        }
    }

    // Referencias "última versión" para que el efecto de abajo pueda llamar
    // siempre la versión más reciente de estas funciones (con achievements/
    // titles ya cargados) sin tener que declararlas como dependencia — ambas
    // cambian de identidad en cada render y forzarían el sync a repetirse.
    // Se actualizan en un efecto (no durante el render) para no leer/escribir
    // un ref fuera de fase.
    const syncProgressionRef = useRef(syncProgression);
    const announceUnlocksRef = useRef(announceUnlocks);

    useEffect(() => {
        syncProgressionRef.current = syncProgression;
        announceUnlocksRef.current = announceUnlocks;
    });

    // Al entrar (o cambiar de cuenta), reevalúa server-side por si el usuario
    // ya califica para algo que todavía no tiene desbloqueado — p. ej. la
    // primera vez que corre esta versión, o progreso hecho desde otro dispositivo.
    useEffect(() => {
        if (!userId || syncedOnMountFor.current === userId) {
            return;
        }
        syncedOnMountFor.current = userId;

        syncProgressionRef
            .current()
            .then((result) => announceUnlocksRef.current(result))
            .catch(() => {
                // Silencioso: un fallo acá no debe bloquear el resto del dashboard.
            });
    }, [userId]);

    // Autocorrección de zona horaria: complete_mission()/fn_current_streak()
    // deciden "hoy" en base a profiles.timezone_offset_minutes (ver
    // supabase/migrations/0005_timezone_aware_daily_reset.sql). Las cuentas
    // creadas antes de esa migración, o por OAuth (que no manda este dato al
    // registrarse), arrancan en 0/UTC — esto la pone al día apenas carga el
    // dashboard, sin pedirle nada al usuario. Se resuelve solo (sin ref-guard):
    // en cuanto el valor guardado coincide con el local, el efecto no hace nada.
    useEffect(() => {
        if (!userId || !profile) {
            return;
        }

        const localOffset = new Date().getTimezoneOffset();
        if (profile.timezone_offset_minutes === localOffset) {
            return;
        }

        editProfile({ timezone_offset_minutes: localOffset }).catch(() => {
            // Silencioso: si falla, se reintenta en el próximo mount.
        });
    }, [userId, profile, editProfile]);

    // Se dispara cuando el timer local llega a cero (ver usePomodoroTimer) —
    // recién ahí se le pide al servidor que cierre la sesión: es el único que
    // decide cuánto tiempo real pasó (started_at lo fijó él mismo al arrancar)
    // y cuánta recompensa corresponde, nunca el cliente.
    function handlePomodoroExpire(timer: ActiveTimer) {
        completePomodoroSession(timer.sessionId)
            .then((result) => {
                const approximateActualMinutes = result.was_completed
                    ? timer.durationMinutes
                    : Math.max(0, Math.floor((Date.now() - timer.startedAt) / 60_000));

                addPomodoroSession({
                    id: timer.sessionId,
                    user_id: userId ?? "",
                    mode: timer.mode,
                    duration_minutes: timer.durationMinutes,
                    actual_minutes: approximateActualMinutes,
                    stat: timer.stat,
                    mission_id: timer.missionId,
                    xp_awarded: result.xp_gained,
                    was_completed: result.was_completed,
                    local_date: toDateKey(new Date(timer.startedAt)),
                    started_at: new Date(timer.startedAt).toISOString(),
                    completed_at: new Date().toISOString(),
                    created_at: new Date(timer.startedAt).toISOString()
                });

                if (!result.was_completed) {
                    notify({ kind: "info", title: "Sesión interrumpida", lines: ["No se otorgó recompensa."] });
                    return;
                }

                if (timer.mode === "focus") {
                    applyMissionReward(result);

                    const lines: string[] = [];
                    if (result.stat) {
                        lines.push(`+${result.stat_gained} ${result.stat}`);
                    }
                    if (result.bonus_applied) {
                        lines.push("Racha de foco: +10% XP");
                    }
                    notify({ kind: "mission", title: `+${result.xp_gained} XP`, lines });

                    if (result.leveled_up) {
                        notify({ kind: "levelup", title: `Nivel ${result.new_level}` });
                    }
                    maybeShowLevelUp(result);

                    syncProgression().then(announceUnlocks);
                } else {
                    notify({ kind: "info", title: "Descanso completo", lines: ["Volvé cuando estés listo para otra sesión."] });
                }
            })
            .catch(() => {
                setActionError("No se pudo cerrar la sesión de foco.");
            });
    }

    const pomodoroTimerControls = usePomodoroTimer(userId, handlePomodoroExpire);

    async function handleStartFocusTimer(
        mode: PomodoroMode,
        durationMinutes: number,
        stat: string | null,
        missionId: string | null
    ) {
        setActionError(null);

        try {
            await pomodoroTimerControls.start(mode, durationMinutes, stat, missionId);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo iniciar la sesión.");
            throw err;
        }
    }

    async function handleStopFocusTimer() {
        const timer = pomodoroTimerControls.activeTimer;
        if (!timer) {
            return;
        }

        setActionError(null);

        try {
            await stopPomodoroSession(timer.sessionId);

            addPomodoroSession({
                id: timer.sessionId,
                user_id: userId ?? "",
                mode: timer.mode,
                duration_minutes: timer.durationMinutes,
                actual_minutes: Math.max(0, Math.floor((Date.now() - timer.startedAt) / 60_000)),
                stat: timer.stat,
                mission_id: timer.missionId,
                xp_awarded: 0,
                was_completed: false,
                local_date: toDateKey(new Date(timer.startedAt)),
                started_at: new Date(timer.startedAt).toISOString(),
                completed_at: new Date().toISOString(),
                created_at: new Date(timer.startedAt).toISOString()
            });

            pomodoroTimerControls.clear();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo detener la sesión.");
        }
    }

    async function handleCompleteMission(missionId: string) {
        setActionError(null);

        try {
            const result = await completeMission(missionId);
            applyMissionReward(result);

            const lines = [`+${result.coins_gained} XYR`];
            if (result.stat) {
                lines.push(`+${result.stat_gained} ${result.stat}`);
            }
            notify({ kind: "mission", title: `+${result.xp_gained} XP`, lines });

            if (result.leveled_up) {
                notify({ kind: "levelup", title: `Nivel ${result.new_level}` });
            }
            maybeShowLevelUp(result);

            const progressionResult = await syncProgression();
            announceUnlocks(progressionResult);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo completar la misión.");
        }
    }

    async function handleCompleteHabit(habitId: string) {
        setActionError(null);

        try {
            const result = await completeHabit(habitId);
            applyMissionReward(result);

            const lines = [`+${result.coins_gained} XYR`];
            if (result.stat) {
                lines.push(`+${result.stat_gained} ${result.stat}`);
            }
            notify({ kind: "habit", title: `+${result.xp_gained} XP`, lines });

            if (result.leveled_up) {
                notify({ kind: "levelup", title: `Nivel ${result.new_level}` });
            }
            maybeShowLevelUp(result);

            const progressionResult = await syncProgression();
            announceUnlocks(progressionResult);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo completar el hábito.");
        }
    }

    async function handleAddHabit(input: NewHabitInput) {
        if (!userId) {
            return;
        }

        setActionError(null);

        try {
            await addHabit(userId, input);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo crear el hábito.");
            throw err;
        }
    }

    async function handleRemoveHabit(habitId: string) {
        setActionError(null);

        try {
            await removeHabit(habitId);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo eliminar el hábito.");
        }
    }

    async function handleAddCustomMission(input: NewMissionInput) {
        if (!userId) {
            return;
        }

        setActionError(null);

        try {
            await addCustomMission(userId, input);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo crear la misión.");
            throw err;
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

    async function handleUnlockSkill(skillId: string) {
        setActionError(null);

        try {
            await unlockSkill(skillId);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo desbloquear la skill.");
            throw err;
        }
    }

    async function handleLogout() {
        await signOut();
        navigate("/login");
    }

    if (!userId || profileLoading || missionsLoading || habitsLoading || !profile) {
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

    const weeklyGains = computeWeeklyGainByStat(missions, userMissions, new Date(), habits, habitCompletions);

    const dailyQuests = missions.filter((mission) => mission.owner_user_id === null).map(missionToQuest);
    const customQuests = missions.filter((mission) => mission.owner_user_id === userId).map(missionToQuest);

    // La racha general refleja CUALQUIER actividad del día (misión o hábito
    // completado), no solo misiones — por eso questLog combina ambas fuentes
    // en vez de derivarse solo de userMissions.
    const questLog: QuestLogEntry[] = [
        ...userMissions.map((entry) => {
            const completedDate = new Date(entry.completed_at);
            return {
                questId: entry.mission_id ?? entry.id,
                dateKey: toDateKey(completedDate),
                completedAt: completedDate.getTime()
            };
        }),
        ...habitCompletions.map((entry) => {
            const completedDate = new Date(entry.completed_at);
            return {
                questId: entry.habit_id ?? entry.id,
                dateKey: entry.local_date,
                completedAt: completedDate.getTime()
            };
        })
    ];

    const streak = computeStreakFromDates(questLog.map((entry) => entry.dateKey));
    const progression = getProgression(profile.xp);

    // Puntos de habilidad disponibles = nivel - costo ya gastado, derivado
    // siempre de datos reales (nunca una columna aparte que se pueda
    // desincronizar) — ver supabase/migrations/0008_skill_tree.sql.
    const skillPointsSpent = skills
        .filter((skill) => unlockedSkillIds.has(skill.id))
        .reduce((total, skill) => total + skill.cost, 0);
    const skillPointsAvailable = progression.level - skillPointsSpent;

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
        achievements,
        userAchievements,
        unlockedAchievementIds,
        titles,
        userTitles,
        unlockedTitleIds,
        skills,
        userSkills,
        unlockedSkillIds,
        skillPointsAvailable,
        unlockSkill: handleUnlockSkill,
        pomodoroSessions,
        xpTransactions,
        activeTimer: pomodoroTimerControls.activeTimer,
        pomodoroRemaining: pomodoroTimerControls.remaining,
        startFocusTimer: handleStartFocusTimer,
        pauseFocusTimer: pomodoroTimerControls.pause,
        resumeFocusTimer: pomodoroTimerControls.resume,
        stopFocusTimer: handleStopFocusTimer,
        isCompletedInCurrentPeriod,
        completeMission: handleCompleteMission,
        addCustomMission: handleAddCustomMission,
        removeCustomMission: handleRemoveCustomMission,
        habits,
        habitCompletions,
        isHabitCompletedInCurrentPeriod,
        completeHabit: handleCompleteHabit,
        addHabit: handleAddHabit,
        removeHabit: handleRemoveHabit,
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
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkNotificationRead={markNotificationRead}
                    onMarkAllNotificationsRead={markAllNotificationsRead}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                    onLogout={handleLogout}
                />

                <main className="app-content">
                    {(actionError || profileError || missionsError || habitsError || skillsError || pomodoroSessionsError) && (
                        <p className="dashboard-error" role="alert">
                            {actionError || profileError || missionsError || habitsError || skillsError || pomodoroSessionsError}
                        </p>
                    )}

                    <Outlet context={contextValue} />
                </main>

                <BottomNav />
            </div>

            {levelUp && (
                <LevelUpOverlay fromLevel={levelUp.from} toLevel={levelUp.to} onDismiss={() => setLevelUp(null)} />
            )}

            {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
        </div>
    );
}

export default AppLayout;
