import { useEffect, useRef, useState } from "react";
import type { PomodoroMode } from "../services/pomodoroService";
import { startPomodoroSession } from "../services/pomodoroService";
import type { ActiveTimer } from "../systems/pomodoroTimer";
import { isExpired, pauseTimer, remainingMs, resumeTimer } from "../systems/pomodoroTimer";

function storageKey(userId: string): string {
    return `xyron:pomodoro:${userId}`;
}

function loadActiveTimer(userId: string): ActiveTimer | null {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        return raw ? (JSON.parse(raw) as ActiveTimer) : null;
    } catch {
        return null;
    }
}

interface UsePomodoroTimerResult {
    activeTimer: ActiveTimer | null;
    remaining: number;
    start: (mode: PomodoroMode, durationMinutes: number, stat: string | null, missionId: string | null) => Promise<void>;
    pause: () => void;
    resume: () => void;
    clear: () => void;
}

// El timer nunca confía en cuántas veces disparó el intervalo: cada tick solo
// fuerza un re-render, y el tiempo restante siempre sale de restar
// timestamps reales (ver systems/pomodoroTimer.ts) — así sigue siendo
// preciso si el navegador frena el intervalo en una pestaña en segundo plano,
// o si se recarga la página a mitad de una sesión (se persiste en
// localStorage y se retoma solo).
export function usePomodoroTimer(
    userId: string | null,
    onExpire: (timer: ActiveTimer) => void
): UsePomodoroTimerResult {
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => (userId ? loadActiveTimer(userId) : null));
    const [now, setNow] = useState(() => Date.now());
    const [loadedForUserId, setLoadedForUserId] = useState(userId);
    const firedExpireFor = useRef<string | null>(null);

    // Ajuste durante el render (mismo patrón que CharacterNotes.tsx): si
    // cambia la cuenta logueada, retoma el timer (si hay uno) de ESA cuenta
    // antes de pintar.
    if (userId !== loadedForUserId) {
        setLoadedForUserId(userId);
        setActiveTimer(userId ? loadActiveTimer(userId) : null);
    }

    useEffect(() => {
        if (!activeTimer || activeTimer.pausedAt !== null) {
            return;
        }

        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [activeTimer]);

    // Al volver a la pestaña, refresca de inmediato en vez de esperar hasta
    // el próximo tick del intervalo (que pudo haber estado pausado por el
    // navegador mientras la pestaña no era visible).
    useEffect(() => {
        function handleVisibility() {
            if (document.visibilityState === "visible") {
                setNow(Date.now());
            }
        }

        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    useEffect(() => {
        if (userId) {
            if (activeTimer) {
                localStorage.setItem(storageKey(userId), JSON.stringify(activeTimer));
            } else {
                localStorage.removeItem(storageKey(userId));
            }
        }
    }, [userId, activeTimer]);

    useEffect(() => {
        if (
            activeTimer &&
            activeTimer.pausedAt === null &&
            isExpired(activeTimer, now) &&
            firedExpireFor.current !== activeTimer.sessionId
        ) {
            firedExpireFor.current = activeTimer.sessionId;
            // El hook se limpia solo (no depende de que el llamador se
            // acuerde de llamar clear()): el timer visual para en 00:00 de
            // inmediato, y onExpire sigue en curso en paralelo para cerrar
            // la sesión contra el servidor y mostrar el toast de recompensa.
            onExpire(activeTimer);
            setActiveTimer(null);
        }
    }, [activeTimer, now, onExpire]);

    async function start(mode: PomodoroMode, durationMinutes: number, stat: string | null, missionId: string | null) {
        const sessionId = await startPomodoroSession(mode, durationMinutes, stat, missionId);
        setActiveTimer({ sessionId, mode, durationMinutes, startedAt: Date.now(), pausedAt: null, stat, missionId });
        setNow(Date.now());
    }

    function pause() {
        setActiveTimer((prev) => (prev ? pauseTimer(prev) : prev));
    }

    function resume() {
        setActiveTimer((prev) => (prev ? resumeTimer(prev) : prev));
        setNow(Date.now());
    }

    function clear() {
        firedExpireFor.current = null;
        setActiveTimer(null);
    }

    return {
        activeTimer,
        remaining: activeTimer ? remainingMs(activeTimer, now) : 0,
        start,
        pause,
        resume,
        clear
    };
}
