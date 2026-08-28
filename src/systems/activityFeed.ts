import type { Mission, UserMission } from "../services/missionService";
import type { Habit, HabitCompletion } from "../services/habitService";
import type { AchievementRow, TitleRow, UserAchievementRow, UserTitleRow } from "../services/progressionService";
import type { SkillRow, UserSkillRow } from "../services/skillService";
import type { PomodoroSession } from "../services/pomodoroService";

export type ActivityEventType = "mission" | "habit" | "achievement" | "title" | "skill" | "focus";

export interface ActivityEvent {
    id: string;
    type: ActivityEventType;
    label: string;
    detail: string;
    timestamp: number;
}

export interface ActivityFeedInput {
    userMissions: UserMission[];
    missions: Mission[];
    userAchievements: UserAchievementRow[];
    achievements: AchievementRow[];
    userTitles: UserTitleRow[];
    titles: TitleRow[];
    userSkills: UserSkillRow[];
    skills: SkillRow[];
    pomodoroSessions: PomodoroSession[];
    habitCompletions: HabitCompletion[];
    habits: Habit[];
}

// Combina todas las fuentes de progreso ya cargadas (nada de queries nuevas)
// en una sola línea de tiempo, para que el dashboard tenga una noción real de
// "actividad reciente" sin necesitar una tabla de eventos dedicada.
export function buildActivityFeed(input: ActivityFeedInput, limit: number = 8): ActivityEvent[] {
    const events: ActivityEvent[] = [];

    for (const entry of input.userMissions) {
        const mission = input.missions.find((item) => item.id === entry.mission_id);
        events.push({
            id: `mission-${entry.id}`,
            type: "mission",
            label: mission ? mission.title : "Misión completada",
            detail: mission ? `+${mission.xp_reward} XP` : "",
            timestamp: new Date(entry.completed_at).getTime()
        });
    }

    for (const entry of input.habitCompletions) {
        const habit = input.habits.find((item) => item.id === entry.habit_id);
        events.push({
            id: `habit-${entry.id}`,
            type: "habit",
            label: habit ? habit.title : "Hábito completado",
            detail: habit ? `+${habit.xp_reward} XP` : "",
            timestamp: new Date(entry.completed_at).getTime()
        });
    }

    for (const entry of input.userAchievements) {
        const achievement = input.achievements.find((item) => item.id === entry.achievement_id);
        events.push({
            id: `achievement-${entry.id}`,
            type: "achievement",
            label: achievement ? achievement.name : "Logro desbloqueado",
            detail: "Logro desbloqueado",
            timestamp: new Date(entry.unlocked_at).getTime()
        });
    }

    for (const entry of input.userTitles) {
        const title = input.titles.find((item) => item.id === entry.title_id);
        events.push({
            id: `title-${entry.id}`,
            type: "title",
            label: title ? title.name : "Título desbloqueado",
            detail: "Título desbloqueado",
            timestamp: new Date(entry.unlocked_at).getTime()
        });
    }

    for (const entry of input.userSkills) {
        const skill = input.skills.find((item) => item.id === entry.skill_id);
        events.push({
            id: `skill-${entry.id}`,
            type: "skill",
            label: skill ? skill.name : "Skill desbloqueada",
            detail: skill ? skill.category : "Skill desbloqueada",
            timestamp: new Date(entry.unlocked_at).getTime()
        });
    }

    for (const session of input.pomodoroSessions) {
        if (session.mode !== "focus" || !session.was_completed || !session.completed_at) {
            continue;
        }
        events.push({
            id: `focus-${session.id}`,
            type: "focus",
            label: `Sesión de foco (${session.actual_minutes ?? session.duration_minutes} min)`,
            detail: session.xp_awarded > 0 ? `+${session.xp_awarded} XP` : "",
            timestamp: new Date(session.completed_at).getTime()
        });
    }

    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}
