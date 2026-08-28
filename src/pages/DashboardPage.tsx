import { Link } from "react-router-dom";
import { Fire, Timer } from "@phosphor-icons/react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import StatsRadar from "../components/StatsRadar";
import StreakCard from "../components/dashboard/StreakCard";
import XpProgress from "../components/dashboard/XpProgress";
import ActivityFeedList from "../components/dashboard/ActivityFeedList";
import CoinBalance from "../components/ui/CoinBalance";
import Badge from "../components/ui/Badge";
import MissionCard from "../components/missions/MissionCard";
import HabitCard from "../components/habits/HabitCard";
import { computeHabitCompletionRate, computeHabitStreak } from "../systems/habitStats";
import RecentAchievements from "../components/achievements/RecentAchievements";
import CharacterNotes from "../components/CharacterNotes";
import { getRankForLevel } from "../systems/rank";
import { buildActivityFeed } from "../systems/activityFeed";
import { focusMinutesOn } from "../systems/pomodoroStats";
import { toDateKey } from "../systems/date";

function DashboardPage() {
    const {
        userId,
        profile,
        progression,
        streak,
        radarStats,
        questLog,
        titles,
        userTitles,
        achievements,
        userAchievements,
        skills,
        userSkills,
        skillPointsAvailable,
        missions,
        userMissions,
        dailyQuests,
        pomodoroSessions,
        isCompletedInCurrentPeriod,
        completeMission,
        habits,
        habitCompletions,
        isHabitCompletedInCurrentPeriod,
        completeHabit
    } = useDashboardContext();

    const rank = getRankForLevel(progression.level);
    const initial = profile.name.trim().charAt(0).toUpperCase() || "?";
    const activeTitle = titles.find((title) => title.id === profile.active_title_id);
    const todayFocusMinutes = focusMinutesOn(pomodoroSessions, toDateKey(new Date()));

    const activity = buildActivityFeed({
        userMissions,
        missions,
        userAchievements,
        achievements,
        userTitles,
        titles,
        userSkills,
        skills,
        pomodoroSessions,
        habitCompletions,
        habits
    });

    return (
        <div className="page-stack">
            <section className="card player-header animate-in">
                <div className="player-header-top">
                    <span className="profile-avatar" aria-hidden="true">
                        {initial}
                    </span>
                    <div>
                        <p className="eyebrow">Bienvenido de nuevo</p>
                        <h1>{profile.name}</h1>
                        {activeTitle && <p className="profile-title">"{activeTitle.name}"</p>}
                    </div>
                </div>

                <div className="profile-header-tags">
                    <Badge variant="primary">Nivel {progression.level}</Badge>
                    <Badge>{rank.toUpperCase()}</Badge>
                </div>

                <div className="player-header-progress">
                    <XpProgress
                        currentXp={progression.currentXp}
                        xpRequired={progression.xpRequired}
                        totalXp={profile.xp}
                    />
                    <span className="text-muted">
                        {progression.currentXp} / {progression.xpRequired} XP
                    </span>
                </div>
            </section>

            <div className="stat-tile-row stat-tile-row--quad">
                <div className="card stat-tile animate-in">
                    <span className="eyebrow">Monedas</span>
                    <CoinBalance coins={profile.coins} size="lg" />
                </div>

                <div className="card stat-tile animate-in">
                    <span className="eyebrow">Racha</span>
                    <span className="stat-tile-value">
                        <Fire size={18} weight="fill" aria-hidden="true" /> {streak.current} {streak.current === 1 ? "día" : "días"}
                    </span>
                </div>

                <div className="card stat-tile animate-in">
                    <span className="eyebrow">Skill Points</span>
                    <span className="stat-tile-value">{skillPointsAvailable}</span>
                </div>

                <div className="card stat-tile animate-in">
                    <span className="eyebrow">Foco hoy</span>
                    <span className="stat-tile-value">
                        <Timer size={18} weight="fill" aria-hidden="true" /> {todayFocusMinutes} min
                    </span>
                </div>
            </div>

            <StreakCard streak={streak} activeDateKeys={questLog.map((entry) => entry.dateKey)} />

            <section className="animate-in">
                <div className="section-header">
                    <h2>Misiones de hoy</h2>
                    <Link to="/missions" className="btn btn--secondary btn--sm">
                        Ver todas
                    </Link>
                </div>
                <ul className="mission-grid">
                    {dailyQuests.map((quest) => (
                        <MissionCard
                            key={quest.id}
                            quest={quest}
                            kind="daily"
                            isCompleted={isCompletedInCurrentPeriod(quest.id)}
                            onComplete={completeMission}
                        />
                    ))}
                </ul>
            </section>

            {habits.length > 0 && (
                <section className="animate-in">
                    <div className="section-header">
                        <h2>Hábitos de hoy</h2>
                        <Link to="/habits" className="btn btn--secondary btn--sm">
                            Ver todos
                        </Link>
                    </div>
                    <ul className="mission-grid">
                        {habits.map((habit) => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                streak={computeHabitStreak(habit.id, habitCompletions)}
                                completionRate={computeHabitCompletionRate(habit, habitCompletions)}
                                isCompleted={isHabitCompletedInCurrentPeriod(habit.id)}
                                onComplete={completeHabit}
                            />
                        ))}
                    </ul>
                </section>
            )}

            <section className="card animate-in">
                <div className="section-header">
                    <h2>Atributos</h2>
                    <Link to="/attributes" className="btn btn--secondary btn--sm">
                        Configurar radar
                    </Link>
                </div>
                <StatsRadar stats={radarStats} />
            </section>

            <section className="card animate-in">
                <div className="section-header">
                    <h2>Logros recientes</h2>
                    <Link to="/achievements" className="btn btn--secondary btn--sm">
                        Ver todos
                    </Link>
                </div>
                <RecentAchievements achievements={achievements} userAchievements={userAchievements} />
            </section>

            <section className="card animate-in">
                <h2>Actividad reciente</h2>
                <ActivityFeedList events={activity} />
            </section>

            <CharacterNotes userId={userId} />
        </div>
    );
}

export default DashboardPage;
