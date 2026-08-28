import type { Habit, HabitCompletion } from "../services/habitService";
import { computeStreakFromDates } from "./streak";
import type { StreakSummary } from "./streak";
import { daysBetween, toDateKey } from "./date";

// Racha propia de un hábito puntual (no la racha general de la cuenta) —
// misma fórmula que la racha general, aplicada solo a las fechas en las que
// se completó ESTE hábito.
export function computeHabitStreak(habitId: string, completions: HabitCompletion[]): StreakSummary {
    const dateKeys = completions
        .filter((entry) => entry.habit_id === habitId)
        .map((entry) => entry.local_date);

    return computeStreakFromDates(dateKeys);
}

// % de días desde que se creó el hábito que tuvieron al menos una completada
// — mismo criterio que computeCompletionRate en calendarStats.ts, pero
// acotado a la fecha de creación del hábito en vez de la de la cuenta.
export function computeHabitCompletionRate(
    habit: Habit,
    completions: HabitCompletion[],
    now: Date = new Date()
): number {
    const dateKeys = new Set(
        completions.filter((entry) => entry.habit_id === habit.id).map((entry) => entry.local_date)
    );

    const daysSinceCreated = Math.max(1, daysBetween(toDateKey(new Date(habit.created_at)), toDateKey(now)) + 1);
    return Math.round((dateKeys.size / daysSinceCreated) * 100);
}
