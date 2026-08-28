import type { AchievementRow, UserAchievementRow } from "../../services/progressionService";
import AchievementCard from "./AchievementCard";

interface RecentAchievementsProps {
    achievements: AchievementRow[];
    userAchievements: UserAchievementRow[];
    count?: number;
}

function RecentAchievements({ achievements, userAchievements, count = 3 }: RecentAchievementsProps) {
    const recent = [...userAchievements]
        .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
        .slice(0, count)
        .map((entry) => achievements.find((item) => item.id === entry.achievement_id))
        .filter((item): item is AchievementRow => item !== undefined);

    if (recent.length === 0) {
        return <p className="text-muted">Todavía no desbloqueaste logros.</p>;
    }

    return (
        <ul className="achievement-grid">
            {recent.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} isUnlocked />
            ))}
        </ul>
    );
}

export default RecentAchievements;
