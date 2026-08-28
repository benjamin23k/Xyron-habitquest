import type { UserMission } from "../services/missionService";
import type { HabitCompletion } from "../services/habitService";
import type { PomodoroSession } from "../services/pomodoroService";
import type { XpTransaction } from "../services/xpTransactionService";
import { toDateKey } from "./date";

export interface AnalyticsBucket {
    label: string;
    value: number;
}

export function buildDailyXpMap(xpTransactions: XpTransaction[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const tx of xpTransactions) {
        const key = toDateKey(new Date(tx.created_at));
        map.set(key, (map.get(key) ?? 0) + tx.amount);
    }
    return map;
}

export function buildDailyQuestMap(userMissions: UserMission[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const entry of userMissions) {
        const key = toDateKey(new Date(entry.completed_at));
        map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
}

export function buildDailyHabitMap(habitCompletions: HabitCompletion[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const entry of habitCompletions) {
        map.set(entry.local_date, (map.get(entry.local_date) ?? 0) + 1);
    }
    return map;
}

export function buildDailyFocusMap(sessions: PomodoroSession[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const session of sessions) {
        if (session.mode !== "focus" || !session.was_completed) {
            continue;
        }
        map.set(session.local_date, (map.get(session.local_date) ?? 0) + (session.actual_minutes ?? 0));
    }
    return map;
}

export function sumInRange(dailyValues: Map<string, number>, rangeDays: number, now: Date = new Date()): number {
    let sum = 0;
    for (let d = 0; d < rangeDays; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        sum += dailyValues.get(toDateKey(date)) ?? 0;
    }
    return sum;
}

const MAX_BUCKETS = 12;

// Agrupa un mapa día→valor en como mucho MAX_BUCKETS barras, sin importar el
// rango elegido (7/30/90/365 días) — así el gráfico siempre queda legible.
export function bucketSeries(dailyValues: Map<string, number>, rangeDays: number, now: Date = new Date()): AnalyticsBucket[] {
    const bucketCount = Math.min(MAX_BUCKETS, rangeDays);
    const daysPerBucket = Math.ceil(rangeDays / bucketCount);
    const buckets: AnalyticsBucket[] = [];

    for (let b = bucketCount - 1; b >= 0; b--) {
        const endOffset = b * daysPerBucket;
        const startOffset = Math.min(rangeDays - 1, endOffset + daysPerBucket - 1);

        let sum = 0;
        let bucketStartDate: Date | null = null;

        for (let d = startOffset; d >= endOffset; d--) {
            const date = new Date(now);
            date.setDate(date.getDate() - d);
            if (!bucketStartDate) {
                bucketStartDate = date;
            }
            sum += dailyValues.get(toDateKey(date)) ?? 0;
        }

        const label = bucketStartDate
            ? daysPerBucket === 1
                ? String(bucketStartDate.getDate())
                : `${bucketStartDate.getDate()}/${bucketStartDate.getMonth() + 1}`
            : "";

        buckets.push({ label, value: sum });
    }

    return buckets;
}
