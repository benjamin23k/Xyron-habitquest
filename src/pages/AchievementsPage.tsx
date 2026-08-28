import { useDashboardContext } from "../hooks/useDashboardContext";
import AchievementCard from "../components/achievements/AchievementCard";
import achievementsList from "../data/achievements";

function AchievementsPage() {
    const { unlockedAchievementIds } = useDashboardContext();

    return (
        <div className="page-stack">
            <h1>Logros</h1>
            <p className="text-muted">
                {unlockedAchievementIds.length}/{achievementsList.length} desbloqueados
            </p>

            <ul className="achievement-grid">
                {achievementsList.map((achievement) => (
                    <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        isUnlocked={unlockedAchievementIds.includes(achievement.id)}
                    />
                ))}
            </ul>
        </div>
    );
}

export default AchievementsPage;
