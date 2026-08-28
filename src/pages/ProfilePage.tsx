import { Fire } from "@phosphor-icons/react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import ProgressBar from "../components/ui/ProgressBar";
import CoinBalance from "../components/ui/CoinBalance";
import Badge from "../components/ui/Badge";
import IconGlyph from "../components/ui/IconGlyph";
import AchievementCard from "../components/achievements/AchievementCard";
import achievementsList from "../data/achievements";
import { getRankForLevel } from "../systems/rank";

function ProfilePage() {
    const { profile, progression, streak, stats, unlockedAchievementIds } = useDashboardContext();
    const rank = getRankForLevel(progression.level);
    const initial = profile.name.trim().charAt(0).toUpperCase() || "?";

    const recentAchievements = achievementsList
        .filter((achievement) => unlockedAchievementIds.includes(achievement.id))
        .slice(-3)
        .reverse();

    return (
        <div className="page-stack">
            <section className="card profile-header animate-in">
                <span className="profile-avatar" aria-hidden="true">
                    {initial}
                </span>
                <h1>{profile.name}</h1>
                <p className="text-muted">@{profile.username}</p>

                <div className="profile-header-tags">
                    <Badge variant="primary">Nivel {progression.level}</Badge>
                    <Badge>{rank.toUpperCase()}</Badge>
                    <Badge variant="success">{profile.membership}</Badge>
                </div>

                <div className="player-header-progress">
                    <ProgressBar
                        value={progression.currentXp}
                        max={progression.xpRequired}
                        variant="xp"
                        size="lg"
                        label="Progreso de experiencia"
                    />
                    <span className="text-muted">
                        {progression.currentXp} / {progression.xpRequired} XP
                    </span>
                </div>

                <div className="profile-header-stats">
                    <CoinBalance coins={profile.coins} size="lg" />
                    <span className="stat-tile-value">
                        <Fire size={18} weight="fill" aria-hidden="true" /> {streak.current} {streak.current === 1 ? "día" : "días"}
                    </span>
                </div>
            </section>

            <section className="card animate-in">
                <h2>Resumen de atributos</h2>
                <ul className="profile-attribute-summary">
                    {stats.map((stat) => (
                        <li key={stat.id}>
                            <IconGlyph iconKey={stat.icon} size={18} weight="fill" /> {stat.name}
                            <span className="text-muted">
                                {stat.value}/{stat.max_value}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="card animate-in">
                <h2>Logros recientes</h2>

                {recentAchievements.length > 0 ? (
                    <ul className="achievement-grid">
                        {recentAchievements.map((achievement) => (
                            <AchievementCard key={achievement.id} achievement={achievement} isUnlocked />
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted">Todavía no desbloqueaste logros.</p>
                )}
            </section>
        </div>
    );
}

export default ProfilePage;
