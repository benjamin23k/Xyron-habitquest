import { daysBetween, toDateKey } from "./date";

export interface StreakSummary {
    current: number;
    longest: number;
}

// Calcula la racha directamente desde las fechas de actividad (p. ej. completed_at
// de user_missions en Supabase), sin depender de un contador guardado aparte — así
// da el mismo resultado sin importar desde qué dispositivo se completó cada misión.
export function computeStreakFromDates(dateKeys: string[], today: Date = new Date()): StreakSummary {
    const uniqueSorted = Array.from(new Set(dateKeys)).sort();

    if (uniqueSorted.length === 0) {
        return { current: 0, longest: 0 };
    }

    let longest = 1;
    let run = 1;

    for (let i = 1; i < uniqueSorted.length; i++) {
        run = daysBetween(uniqueSorted[i - 1], uniqueSorted[i]) === 1 ? run + 1 : 1;
        longest = Math.max(longest, run);
    }

    const lastActiveKey = uniqueSorted[uniqueSorted.length - 1];
    const isStillAlive = daysBetween(lastActiveKey, toDateKey(today)) <= 1;

    return { current: isStillAlive ? run : 0, longest };
}
