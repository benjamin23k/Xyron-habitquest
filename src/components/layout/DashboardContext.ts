import type { Profile, ProfileUpdate, StatRow, StatUpdateInput } from "../../services/profileService";
import type { Mission, NewMissionInput, UserMission } from "../../services/missionService";
import type { Habit, HabitCompletion, NewHabitInput } from "../../services/habitService";
import type { AchievementRow, TitleRow, UserAchievementRow, UserTitleRow } from "../../services/progressionService";
import type { SkillRow, UserSkillRow } from "../../services/skillService";
import type { PomodoroMode, PomodoroSession } from "../../services/pomodoroService";
import type { XpTransaction } from "../../services/xpTransactionService";
import type { Quest } from "../../data/quests";
import type { QuestLogEntry } from "../../systems/questLog";
import type { Progression } from "../../systems/progression";
import type { StreakSummary } from "../../systems/streak";
import type { Stat } from "../../data/character";
import type { ActiveTimer } from "../../systems/pomodoroTimer";
import type { AttributeFormValues } from "../AttributeFormModal";

export interface DashboardContextValue {
    userId: string;
    profile: Profile;
    stats: StatRow[];
    displayStats: Stat[];
    radarStats: Stat[];
    weeklyGains: Record<string, number>;
    missions: Mission[];
    userMissions: UserMission[];
    dailyQuests: Quest[];
    customQuests: Quest[];
    questLog: QuestLogEntry[];
    streak: StreakSummary;
    progression: Progression;
    achievements: AchievementRow[];
    userAchievements: UserAchievementRow[];
    unlockedAchievementIds: Set<string>;
    titles: TitleRow[];
    userTitles: UserTitleRow[];
    unlockedTitleIds: Set<string>;
    skills: SkillRow[];
    userSkills: UserSkillRow[];
    unlockedSkillIds: Set<string>;
    skillPointsAvailable: number;
    unlockSkill: (skillId: string) => Promise<void>;
    pomodoroSessions: PomodoroSession[];
    xpTransactions: XpTransaction[];
    activeTimer: ActiveTimer | null;
    pomodoroRemaining: number;
    startFocusTimer: (
        mode: PomodoroMode,
        durationMinutes: number,
        stat: string | null,
        missionId: string | null
    ) => Promise<void>;
    pauseFocusTimer: () => void;
    resumeFocusTimer: () => void;
    stopFocusTimer: () => Promise<void>;
    isCompletedInCurrentPeriod: (missionId: string) => boolean;
    completeMission: (missionId: string) => Promise<void>;
    addCustomMission: (input: NewMissionInput) => Promise<void>;
    removeCustomMission: (missionId: string) => Promise<void>;
    habits: Habit[];
    habitCompletions: HabitCompletion[];
    isHabitCompletedInCurrentPeriod: (habitId: string) => boolean;
    completeHabit: (habitId: string) => Promise<void>;
    addHabit: (input: NewHabitInput) => Promise<void>;
    removeHabit: (habitId: string) => Promise<void>;
    addStat: (values: AttributeFormValues) => Promise<void>;
    editStat: (statId: string, updates: StatUpdateInput) => Promise<void>;
    removeStat: (statId: string) => Promise<void>;
    editProfile: (updates: ProfileUpdate) => Promise<void>;
}
