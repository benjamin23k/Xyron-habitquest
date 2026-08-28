import { Fire, Timer } from "@phosphor-icons/react";

interface DailyReviewCardProps {
    xpToday: number;
    questsCompleted: number;
    questsTotal: number;
    habitsCompleted: number;
    habitsTotal: number;
    focusMinutesToday: number;
    streakDays: number;
    statsGainedToday: Record<string, number>;
}

function DailyReviewCard({
    xpToday,
    questsCompleted,
    questsTotal,
    habitsCompleted,
    habitsTotal,
    focusMinutesToday,
    streakDays,
    statsGainedToday
}: DailyReviewCardProps) {
    const allQuestsDone = questsTotal > 0 && questsCompleted >= questsTotal;
    const statEntries = Object.entries(statsGainedToday);

    return (
        <section className={allQuestsDone ? "card daily-review daily-review--complete animate-in" : "card daily-review animate-in"}>
            <span className="eyebrow">{allQuestsDone ? "Día completo" : "Tu día"}</span>

            <div className="daily-review-grid">
                <div className="daily-review-item">
                    <span className="daily-review-label">XP ganado</span>
                    <span className="daily-review-value daily-review-value--xp">+{xpToday}</span>
                </div>

                <div className="daily-review-item">
                    <span className="daily-review-label">Misiones</span>
                    <span className="daily-review-value">
                        {questsCompleted}/{questsTotal}
                    </span>
                </div>

                {habitsTotal > 0 && (
                    <div className="daily-review-item">
                        <span className="daily-review-label">Hábitos</span>
                        <span className="daily-review-value">
                            {habitsCompleted}/{habitsTotal}
                        </span>
                    </div>
                )}

                <div className="daily-review-item">
                    <span className="daily-review-label">Foco</span>
                    <span className="daily-review-value">
                        <Timer size={16} weight="fill" aria-hidden="true" /> {focusMinutesToday} min
                    </span>
                </div>

                <div className="daily-review-item">
                    <span className="daily-review-label">Racha</span>
                    <span className="daily-review-value">
                        <Fire size={16} weight="fill" aria-hidden="true" /> {streakDays} {streakDays === 1 ? "día" : "días"}
                    </span>
                </div>
            </div>

            {statEntries.length > 0 && (
                <div className="daily-review-stats">
                    {statEntries.map(([stat, gain]) => (
                        <span key={stat} className="daily-review-stat-chip">
                            {stat} +{gain}
                        </span>
                    ))}
                </div>
            )}
        </section>
    );
}

export default DailyReviewCard;
