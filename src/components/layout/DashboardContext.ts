import type { Profile, ProfileUpdate, StatRow, StatUpdateInput } from "../../services/profileService";
import type { Mission, UserMission } from "../../services/missionService";
import type { Quest } from "../../data/quests";
import type { QuestLogEntry } from "../../systems/questLog";
import type { Progression } from "../../systems/progression";
import type { StreakSummary } from "../../systems/streak";
import type { Stat } from "../../data/character";
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
    unlockedAchievementIds: string[];
    isCompletedToday: (missionId: string) => boolean;
    completeMission: (missionId: string) => Promise<void>;
    addCustomMission: (title: string, stat: string) => Promise<void>;
    removeCustomMission: (missionId: string) => Promise<void>;
    addStat: (values: AttributeFormValues) => Promise<void>;
    editStat: (statId: string, updates: StatUpdateInput) => Promise<void>;
    removeStat: (statId: string) => Promise<void>;
    editProfile: (updates: ProfileUpdate) => Promise<void>;
}
