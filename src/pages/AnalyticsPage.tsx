import { useState } from "react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import BarChart from "../components/ui/BarChart";
import { computeStatGainInRange } from "../systems/statProgress";
import {
    bucketSeries,
    buildDailyFocusMap,
    buildDailyHabitMap,
    buildDailyQuestMap,
    buildDailyXpMap,
    sumInRange
} from "../systems/analyticsStats";

const RANGE_OPTIONS: { value: number; label: string }[] = [
    { value: 7, label: "7 días" },
    { value: 30, label: "30 días" },
    { value: 90, label: "90 días" },
    { value: 365, label: "1 año" }
];

function AnalyticsPage() {
    const { userMissions, pomodoroSessions, xpTransactions, streak, missions, habits, habitCompletions } =
        useDashboardContext();
    const [rangeDays, setRangeDays] = useState(30);

    const dailyXp = buildDailyXpMap(xpTransactions);
    const dailyQuests = buildDailyQuestMap(userMissions);
    const dailyHabits = buildDailyHabitMap(habitCompletions);
    const dailyFocus = buildDailyFocusMap(pomodoroSessions);

    const xpBuckets = bucketSeries(dailyXp, rangeDays);
    const questBuckets = bucketSeries(dailyQuests, rangeDays);
    const habitBuckets = bucketSeries(dailyHabits, rangeDays);
    const focusBuckets = bucketSeries(dailyFocus, rangeDays);

    const totalXp = sumInRange(dailyXp, rangeDays);
    const totalQuests = sumInRange(dailyQuests, rangeDays);
    const totalFocus = sumInRange(dailyFocus, rangeDays);

    const statGains = Object.entries(
        computeStatGainInRange(missions, userMissions, rangeDays, new Date(), habits, habitCompletions)
    ).sort((a, b) => b[1] - a[1]);

    return (
        <div className="page-stack">
            <section className="animate-in">
                <div className="section-header">
                    <div>
                        <h1>Analytics</h1>
                        <p className="text-muted">Tu progreso en el tiempo.</p>
                    </div>
                    <div className="analytics-range-tabs">
                        {RANGE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={
                                    option.value === rangeDays ? "focus-mode-tab focus-mode-tab--active" : "focus-mode-tab"
                                }
                                onClick={() => setRangeDays(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <div className="stat-tile-row stat-tile-row--quad">
                <div className="card stat-tile animate-in">
                    <span className="eyebrow">XP total</span>
                    <span className="stat-tile-value">{totalXp}</span>
                </div>
                <div className="card stat-tile animate-in">
                    <span className="eyebrow">Misiones completadas</span>
                    <span className="stat-tile-value">{totalQuests}</span>
                </div>
                <div className="card stat-tile animate-in">
                    <span className="eyebrow">Minutos de foco</span>
                    <span className="stat-tile-value">{totalFocus}</span>
                </div>
                <div className="card stat-tile animate-in">
                    <span className="eyebrow">Racha actual</span>
                    <span className="stat-tile-value">{streak.current}</span>
                </div>
            </div>

            <section className="card animate-in">
                <h2>Progresión de XP</h2>
                <BarChart data={xpBuckets} />
            </section>

            <section className="card animate-in">
                <h2>Misiones completadas</h2>
                <BarChart data={questBuckets} />
            </section>

            <section className="card animate-in">
                <h2>Hábitos completados</h2>
                <BarChart data={habitBuckets} />
            </section>

            <section className="card animate-in">
                <h2>Minutos de foco</h2>
                <BarChart data={focusBuckets} />
            </section>

            <section className="card animate-in">
                <h2>Evolución de atributos</h2>
                {statGains.length > 0 ? (
                    <ul className="focus-stats-list">
                        {statGains.map(([stat, gain]) => (
                            <li key={stat}>
                                <span className="text-muted">{stat}</span>
                                <span>+{gain}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted">Sin cambios en este período.</p>
                )}
            </section>
        </div>
    );
}

export default AnalyticsPage;
