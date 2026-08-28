import { useEffect, useState } from "react";
import type { CompleteHabitResult, Habit, HabitCompletion, NewHabitInput } from "../services/habitService";
import {
    completeHabit as completeHabitRequest,
    createHabit,
    deleteHabit,
    fetchHabitCompletions,
    fetchHabits
} from "../services/habitService";
import { startOfWeek, toDateKey } from "../systems/date";

interface UseHabitsResult {
    habits: Habit[];
    habitCompletions: HabitCompletion[];
    loading: boolean;
    error: string | null;
    isCompletedInCurrentPeriod: (habitId: string) => boolean;
    completeHabit: (habitId: string) => Promise<CompleteHabitResult>;
    addHabit: (ownerUserId: string, input: NewHabitInput) => Promise<void>;
    removeHabit: (habitId: string) => Promise<void>;
}

export function useHabits(userId: string | null): UseHabitsResult {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Misma bandera de cancelación que useMissions: evita que una carga vieja
        // pise el estado de una carga más nueva que ya resolvió.
        let ignore = false;

        async function load() {
            if (!userId) {
                setHabits([]);
                setHabitCompletions([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [habitsData, completionsData] = await Promise.all([
                    fetchHabits(userId),
                    fetchHabitCompletions(userId)
                ]);

                if (!ignore) {
                    setHabits(habitsData);
                    setHabitCompletions(completionsData);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "No se pudieron cargar los hábitos.");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            ignore = true;
        };
    }, [userId]);

    // Mismo criterio que useMissions.isCompletedInCurrentPeriod: solo para
    // deshabilitar el botón al instante — la fuente de verdad real es
    // complete_habit() en Supabase.
    function isCompletedInCurrentPeriod(habitId: string): boolean {
        const habit = habits.find((candidate) => candidate.id === habitId);
        if (!habit) {
            return false;
        }

        const now = new Date();

        if (habit.frequency === "weekly") {
            const currentWeekStart = startOfWeek(now);
            return habitCompletions.some(
                (entry) => entry.habit_id === habitId && startOfWeek(new Date(entry.completed_at)) === currentWeekStart
            );
        }

        const todayKey = toDateKey(now);
        return habitCompletions.some((entry) => entry.habit_id === habitId && entry.local_date === todayKey);
    }

    async function completeHabit(habitId: string): Promise<CompleteHabitResult> {
        const result = await completeHabitRequest(habitId);

        setHabitCompletions((prev) => [
            {
                id: crypto.randomUUID(),
                user_id: userId ?? "",
                habit_id: habitId,
                completed_at: new Date().toISOString(),
                local_date: toDateKey(new Date())
            },
            ...prev
        ]);

        return result;
    }

    async function addHabit(ownerUserId: string, input: NewHabitInput) {
        const habit = await createHabit(ownerUserId, input);
        setHabits((prev) => [...prev, habit]);
    }

    async function removeHabit(habitId: string) {
        await deleteHabit(habitId);
        setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
    }

    return {
        habits,
        habitCompletions,
        loading,
        error,
        isCompletedInCurrentPeriod,
        completeHabit,
        addHabit,
        removeHabit
    };
}
