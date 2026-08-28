import { useState } from "react";
import type { ChangeEvent } from "react";
import { Fire } from "@phosphor-icons/react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import ProgressBar from "../components/ui/ProgressBar";
import CoinBalance from "../components/ui/CoinBalance";
import Badge from "../components/ui/Badge";
import IconGlyph from "../components/ui/IconGlyph";
import RecentAchievements from "../components/achievements/RecentAchievements";
import { getRankForLevel } from "../systems/rank";

function ProfilePage() {
    const {
        profile,
        progression,
        streak,
        stats,
        achievements,
        userAchievements,
        titles,
        unlockedTitleIds,
        editProfile
    } = useDashboardContext();

    const [titleError, setTitleError] = useState<string | null>(null);
    const [savingTitle, setSavingTitle] = useState(false);

    const rank = getRankForLevel(progression.level);
    const initial = profile.name.trim().charAt(0).toUpperCase() || "?";
    const activeTitle = titles.find((title) => title.id === profile.active_title_id);
    const unlockedTitles = titles.filter((title) => unlockedTitleIds.has(title.id));

    async function handleTitleChange(event: ChangeEvent<HTMLSelectElement>) {
        const value = event.target.value;
        setTitleError(null);
        setSavingTitle(true);

        try {
            await editProfile({ active_title_id: value === "" ? null : value });
        } catch (err) {
            setTitleError(err instanceof Error ? err.message : "No se pudo cambiar el título.");
        } finally {
            setSavingTitle(false);
        }
    }

    return (
        <div className="page-stack">
            <section className="card profile-header animate-in">
                <span className="profile-avatar" aria-hidden="true">
                    {initial}
                </span>
                <h1>{profile.name}</h1>
                <p className="text-muted">@{profile.username}</p>
                {activeTitle && <p className="profile-title">"{activeTitle.name}"</p>}

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
                <h2>Título</h2>

                {unlockedTitles.length > 0 ? (
                    <>
                        <label htmlFor="profile-title-select" className="sr-only">
                            Elegir título activo
                        </label>
                        <select
                            id="profile-title-select"
                            value={profile.active_title_id ?? ""}
                            onChange={handleTitleChange}
                            disabled={savingTitle}
                        >
                            <option value="">Sin título</option>
                            {unlockedTitles.map((title) => (
                                <option key={title.id} value={title.id}>
                                    {title.name}
                                </option>
                            ))}
                        </select>
                        {titleError && (
                            <p className="auth-error" role="alert">
                                {titleError}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-muted">Subí de nivel para desbloquear tu primer título.</p>
                )}
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
                <RecentAchievements achievements={achievements} userAchievements={userAchievements} />
            </section>
        </div>
    );
}

export default ProfilePage;
