import type { Stat } from "../data/character";

export interface AchievementContext {
    completedQuestCount: number;
    totalQuestCount: number;
    streak: number;
    level: number;
    stats: Stat[];
}

export function getUnlockedAchievementIds(context: AchievementContext): string[] {
    const unlocked: string[] = [];

    if (context.completedQuestCount >= 1) {
        unlocked.push("first-quest");
    }

    if (context.completedQuestCount >= 3) {
        unlocked.push("quest-master");
    }

    if (context.totalQuestCount > 0 && context.completedQuestCount >= context.totalQuestCount) {
        unlocked.push("all-quests");
    }

    if (context.streak >= 3) {
        unlocked.push("streak-3");
    }

    if (context.streak >= 7) {
        unlocked.push("streak-7");
    }

    if (context.level >= 5) {
        unlocked.push("level-5");
    }

    if (context.stats.length > 0 && context.stats.every((stat) => stat.value >= 1)) {
        unlocked.push("balanced");
    }

    return unlocked;
}
