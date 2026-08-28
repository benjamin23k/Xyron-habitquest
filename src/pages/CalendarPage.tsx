import { useDashboardContext } from "../hooks/useDashboardContext";
import ProgressCalendar from "../components/calendar/ProgressCalendar";
import DailyReviewCard from "../components/calendar/DailyReviewCard";
import { computeStatGainInRange } from "../systems/statProgress";
import { buildDailyXpMap, sumInRange } from "../systems/analyticsStats";
import { toDateKey } from "../systems/date";

function CalendarPage() {
    const {
        profile,
        missions,
        userMissions,
        pomodoroSessions,
        xpTransactions,
        dailyQuests,
        isCompletedInCurrentPeriod,
        habits,
        habitCompletions,
        isHabitCompletedInCurrentPeriod,
        streak
    } = useDashboardContext();

    const todayKey = toDateKey(new Date());
    const xpToday = sumInRange(buildDailyXpMap(xpTransactions), 1);
    const questsCompletedToday = dailyQuests.filter((quest) => isCompletedInCurrentPeriod(quest.id)).length;
    const habitsCompletedToday = habits.filter((habit) => isHabitCompletedInCurrentPeriod(habit.id)).length;
    const focusMinutesToday = pomodoroSessions
        .filter((session) => session.mode === "focus" && session.was_completed && session.local_date === todayKey)
        .reduce((sum, session) => sum + (session.actual_minutes ?? 0), 0);
    const statsGainedToday = computeStatGainInRange(missions, userMissions, 1, new Date(), habits, habitCompletions);

    return (
        <div className="page-stack">
            <h1>Calendario de progreso</h1>

            <DailyReviewCard
                xpToday={xpToday}
                questsCompleted={questsCompletedToday}
                questsTotal={dailyQuests.length}
                habitsCompleted={habitsCompletedToday}
                habitsTotal={habits.length}
                focusMinutesToday={focusMinutesToday}
                streakDays={streak.current}
                statsGainedToday={statsGainedToday}
            />

            <ProgressCalendar
                missions={missions}
                userMissions={userMissions}
                pomodoroSessions={pomodoroSessions}
                habits={habits}
                habitCompletions={habitCompletions}
                accountCreatedAt={profile.created_at}
            />
        </div>
    );
}

export default CalendarPage;
