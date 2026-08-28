import { useDashboardContext } from "../hooks/useDashboardContext";
import AchievementCard from "../components/achievements/AchievementCard";

function AchievementsPage() {
    const { achievements, unlockedAchievementIds } = useDashboardContext();

    return (
        <div className="page-stack">
            <h1>Logros</h1>
            <p className="text-muted">
                {unlockedAchievementIds.size}/{achievements.length} desbloqueados
            </p>

            <ul className="achievement-grid">
                {achievements.map((achievement) => (
                    <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        isUnlocked={unlockedAchievementIds.has(achievement.id)}
                    />
                ))}
            </ul>
        </div>
    );
}

export default AchievementsPage;
