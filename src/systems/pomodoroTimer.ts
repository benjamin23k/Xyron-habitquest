import type { PomodoroMode } from "../services/pomodoroService";

export interface TimerConfig {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    sessionsBeforeLongBreak: number;
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4
};

export interface ActiveTimer {
    sessionId: string;
    mode: PomodoroMode;
    durationMinutes: number;
    // Timestamps epoch (ms). startedAt se corre hacia adelante al salir de
    // pausa (en vez de acumular un contador aparte) para que el tiempo
    // restante siempre salga de restar dos timestamps — nunca de contar
    // cuántas veces disparó un setInterval, que un tab en segundo plano
    // puede frenar sin avisar.
    startedAt: number;
    pausedAt: number | null;
    stat: string | null;
    missionId: string | null;
}

export function remainingMs(timer: ActiveTimer, now: number = Date.now()): number {
    const elapsedAnchor = timer.pausedAt ?? now;
    const elapsed = elapsedAnchor - timer.startedAt;
    return Math.max(0, timer.durationMinutes * 60_000 - elapsed);
}

export function isExpired(timer: ActiveTimer, now: number = Date.now()): boolean {
    return remainingMs(timer, now) <= 0;
}

export function pauseTimer(timer: ActiveTimer, now: number = Date.now()): ActiveTimer {
    if (timer.pausedAt !== null) {
        return timer;
    }
    return { ...timer, pausedAt: now };
}

export function resumeTimer(timer: ActiveTimer, now: number = Date.now()): ActiveTimer {
    if (timer.pausedAt === null) {
        return timer;
    }
    const pausedDuration = now - timer.pausedAt;
    return { ...timer, startedAt: timer.startedAt + pausedDuration, pausedAt: null };
}

export function formatRemaining(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function nextMode(config: TimerConfig, completedFocusSessionsInCycle: number): PomodoroMode {
    return completedFocusSessionsInCycle > 0 && completedFocusSessionsInCycle % config.sessionsBeforeLongBreak === 0
        ? "long_break"
        : "short_break";
}

export function durationForMode(config: TimerConfig, mode: PomodoroMode): number {
    if (mode === "focus") {
        return config.focusMinutes;
    }
    return mode === "long_break" ? config.longBreakMinutes : config.shortBreakMinutes;
}
