import type { PomodoroSession } from "../services/pomodoroService";
import { toDateKey } from "./date";

const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function isCompletedFocus(session: PomodoroSession): boolean {
    return session.mode === "focus" && session.was_completed;
}

export function totalFocusMinutes(sessions: PomodoroSession[]): number {
    return sessions.filter(isCompletedFocus).reduce((sum, session) => sum + (session.actual_minutes ?? 0), 0);
}

export function focusMinutesOn(sessions: PomodoroSession[], dateKey: string): number {
    return sessions
        .filter((session) => isCompletedFocus(session) && session.local_date === dateKey)
        .reduce((sum, session) => sum + (session.actual_minutes ?? 0), 0);
}

export function focusMinutesInRange(sessions: PomodoroSession[], fromKey: string, toKey: string): number {
    return sessions
        .filter((session) => isCompletedFocus(session) && session.local_date >= fromKey && session.local_date <= toKey)
        .reduce((sum, session) => sum + (session.actual_minutes ?? 0), 0);
}

export function longestFocusSessionMinutes(sessions: PomodoroSession[]): number {
    return sessions.filter(isCompletedFocus).reduce((max, session) => Math.max(max, session.actual_minutes ?? 0), 0);
}

export function completedFocusCount(sessions: PomodoroSession[]): number {
    return sessions.filter(isCompletedFocus).length;
}

export function interruptedFocusCount(sessions: PomodoroSession[]): number {
    return sessions.filter((session) => session.mode === "focus" && !session.was_completed && session.completed_at !== null)
        .length;
}

export function mostProductiveHour(sessions: PomodoroSession[]): number | null {
    const totals = new Array(24).fill(0);
    let hasAny = false;

    for (const session of sessions) {
        if (!isCompletedFocus(session)) {
            continue;
        }
        hasAny = true;
        const hour = new Date(session.started_at).getHours();
        totals[hour] += session.actual_minutes ?? 0;
    }

    if (!hasAny) {
        return null;
    }

    let bestHour = 0;
    for (let hour = 1; hour < 24; hour++) {
        if (totals[hour] > totals[bestHour]) {
            bestHour = hour;
        }
    }
    return bestHour;
}

export interface BestDay {
    dateKey: string;
    minutes: number;
}

export function bestFocusDay(sessions: PomodoroSession[]): BestDay | null {
    const totals = new Map<string, number>();

    for (const session of sessions) {
        if (!isCompletedFocus(session)) {
            continue;
        }
        totals.set(session.local_date, (totals.get(session.local_date) ?? 0) + (session.actual_minutes ?? 0));
    }

    let best: BestDay | null = null;
    for (const [dateKey, minutes] of totals) {
        if (!best || minutes > best.minutes) {
            best = { dateKey, minutes };
        }
    }
    return best;
}

export interface WeeklyFocusBar {
    dateKey: string;
    label: string;
    minutes: number;
}

// Misma convención de semana (lunes primero) que systems/calendar.ts.
export function computeWeeklyFocusBars(sessions: PomodoroSession[], now: Date = new Date()): WeeklyFocusBar[] {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = monday.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diffToMonday);

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(date.getDate() + index);
        const dateKey = toDateKey(date);

        return {
            dateKey,
            label: WEEKDAY_SHORT[index],
            minutes: focusMinutesOn(sessions, dateKey)
        };
    });
}
