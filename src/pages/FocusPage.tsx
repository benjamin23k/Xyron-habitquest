import { useState } from "react";
import { Pause, Play, Stop } from "@phosphor-icons/react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import TimerRing from "../components/pomodoro/TimerRing";
import Button from "../components/ui/Button";
import BarChart from "../components/ui/BarChart";
import {
    DEFAULT_TIMER_CONFIG,
    durationForMode,
    formatRemaining,
    nextMode
} from "../systems/pomodoroTimer";
import type { TimerConfig } from "../systems/pomodoroTimer";
import type { PomodoroMode } from "../services/pomodoroService";
import { toDateKey } from "../systems/date";
import {
    bestFocusDay,
    completedFocusCount,
    computeWeeklyFocusBars,
    focusMinutesInRange,
    focusMinutesOn,
    interruptedFocusCount,
    longestFocusSessionMinutes,
    mostProductiveHour,
    totalFocusMinutes
} from "../systems/pomodoroStats";

const MODE_LABEL: Record<PomodoroMode, string> = {
    focus: "Focus",
    short_break: "Short Break",
    long_break: "Long Break"
};

const CONFIG_STORAGE_KEY = "xyron:pomodoroConfig";

function loadTimerConfig(): TimerConfig {
    try {
        const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
        return raw ? { ...DEFAULT_TIMER_CONFIG, ...(JSON.parse(raw) as Partial<TimerConfig>) } : DEFAULT_TIMER_CONFIG;
    } catch {
        return DEFAULT_TIMER_CONFIG;
    }
}

function countFocusSinceLastLongBreak(sessions: { mode: PomodoroMode; was_completed: boolean }[]): number {
    let count = 0;
    for (const session of sessions) {
        if (session.mode === "long_break") {
            break;
        }
        if (session.mode === "focus" && session.was_completed) {
            count++;
        }
    }
    return count;
}

function formatHour(hour: number): string {
    return `${String(hour).padStart(2, "0")}:00`;
}

function FocusPage() {
    const {
        displayStats,
        dailyQuests,
        customQuests,
        pomodoroSessions,
        activeTimer,
        pomodoroRemaining,
        startFocusTimer,
        pauseFocusTimer,
        resumeFocusTimer,
        stopFocusTimer
    } = useDashboardContext();

    const [config, setConfig] = useState<TimerConfig>(loadTimerConfig);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState<PomodoroMode>("focus");
    const [selectedStat, setSelectedStat] = useState("");
    const [selectedMissionId, setSelectedMissionId] = useState("");
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allQuests = [...dailyQuests, ...customQuests];
    const linkedQuest = activeTimer?.missionId ? allQuests.find((quest) => quest.id === activeTimer.missionId) : null;

    const sessionsInCycle = countFocusSinceLastLongBreak(pomodoroSessions);
    const suggestedNextMode = nextMode(config, sessionsInCycle);

    function persistConfig(next: TimerConfig) {
        setConfig(next);
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
    }

    async function handleStart() {
        setError(null);
        setStarting(true);

        try {
            const duration = durationForMode(config, selectedMode);
            const stat = selectedMode === "focus" ? selectedStat || null : null;
            const missionId = selectedMode === "focus" ? selectedMissionId || null : null;
            await startFocusTimer(selectedMode, duration, stat, missionId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo iniciar la sesión.");
        } finally {
            setStarting(false);
        }
    }

    const durationMs = activeTimer ? activeTimer.durationMinutes * 60_000 : 0;
    const progress = activeTimer && durationMs > 0 ? 1 - pomodoroRemaining / durationMs : 0;
    const isPaused = activeTimer?.pausedAt != null;

    const todayKey = toDateKey(new Date());
    const now = new Date();
    const monthStartKey = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const weeklyBars = computeWeeklyFocusBars(pomodoroSessions, now);
    const weekMinutes = weeklyBars.reduce((sum, bar) => sum + bar.minutes, 0);
    const monthMinutes = focusMinutesInRange(pomodoroSessions, monthStartKey, todayKey);
    const totalMinutes = totalFocusMinutes(pomodoroSessions);
    const todayMinutes = focusMinutesOn(pomodoroSessions, todayKey);
    const longestSession = longestFocusSessionMinutes(pomodoroSessions);
    const completedCount = completedFocusCount(pomodoroSessions);
    const interruptedCount = interruptedFocusCount(pomodoroSessions);
    const best = bestFocusDay(pomodoroSessions);
    const productiveHour = mostProductiveHour(pomodoroSessions);

    return (
        <div className="page-stack">
            <section className="animate-in">
                <h1>Focus Mode</h1>
                <p className="text-muted">Sesiones de trabajo profundo con recompensa real.</p>
            </section>

            <section className="card focus-panel animate-in">
                {activeTimer ? (
                    <div className="focus-active">
                        <span className="eyebrow">{MODE_LABEL[activeTimer.mode]}</span>

                        <TimerRing progress={progress}>
                            <span className="timer-ring-time">{formatRemaining(pomodoroRemaining)}</span>
                            <span className="timer-ring-mode">{isPaused ? "Pausado" : MODE_LABEL[activeTimer.mode]}</span>
                        </TimerRing>

                        {linkedQuest && <p className="focus-linked-quest">Vinculada a: {linkedQuest.title}</p>}
                        {activeTimer.mode === "focus" && activeTimer.stat && (
                            <p className="text-muted">+1 {activeTimer.stat} al completar</p>
                        )}

                        <div className="focus-controls">
                            <Button type="button" variant="secondary" onClick={isPaused ? resumeFocusTimer : pauseFocusTimer}>
                                {isPaused ? (
                                    <>
                                        <Play size={16} weight="fill" aria-hidden="true" /> Reanudar
                                    </>
                                ) : (
                                    <>
                                        <Pause size={16} weight="fill" aria-hidden="true" /> Pausar
                                    </>
                                )}
                            </Button>
                            <Button type="button" variant="danger" onClick={() => void stopFocusTimer()}>
                                <Stop size={16} weight="fill" aria-hidden="true" /> Detener
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="focus-setup">
                        <div className="focus-mode-tabs">
                            {(["focus", "short_break", "long_break"] as PomodoroMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={mode === selectedMode ? "focus-mode-tab focus-mode-tab--active" : "focus-mode-tab"}
                                    onClick={() => setSelectedMode(mode)}
                                >
                                    {MODE_LABEL[mode]}
                                    {mode === suggestedNextMode && mode !== "focus" && (
                                        <span className="focus-mode-tab-hint">sugerido</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <TimerRing progress={0}>
                            <span className="timer-ring-time">{durationForMode(config, selectedMode)} min</span>
                            <span className="timer-ring-mode">{MODE_LABEL[selectedMode]}</span>
                        </TimerRing>

                        {selectedMode === "focus" && (
                            <>
                                <label htmlFor="focus-stat" className="stacked-form-label">
                                    Atributo a mejorar (opcional)
                                </label>
                                <select id="focus-stat" value={selectedStat} onChange={(event) => setSelectedStat(event.target.value)}>
                                    <option value="">Ninguno</option>
                                    {displayStats.map((stat) => (
                                        <option key={stat.name} value={stat.name}>
                                            {stat.name}
                                        </option>
                                    ))}
                                </select>

                                <label htmlFor="focus-mission" className="stacked-form-label">
                                    Vincular con misión (opcional)
                                </label>
                                <select
                                    id="focus-mission"
                                    value={selectedMissionId}
                                    onChange={(event) => setSelectedMissionId(event.target.value)}
                                >
                                    <option value="">Ninguna</option>
                                    {allQuests.map((quest) => (
                                        <option key={quest.id} value={quest.id}>
                                            {quest.title}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                        {error && (
                            <p className="auth-error" role="alert">
                                {error}
                            </p>
                        )}

                        <Button type="button" variant="primary" onClick={handleStart} loading={starting}>
                            <Play size={16} weight="fill" aria-hidden="true" /> Iniciar {MODE_LABEL[selectedMode]}
                        </Button>

                        <button type="button" className="focus-settings-toggle" onClick={() => setSettingsOpen((prev) => !prev)}>
                            {settingsOpen ? "Ocultar personalización" : "Personalizar duración"}
                        </button>

                        {settingsOpen && (
                            <div className="focus-settings">
                                <div>
                                    <label htmlFor="config-focus">Focus (min)</label>
                                    <input
                                        id="config-focus"
                                        type="number"
                                        min={1}
                                        max={180}
                                        value={config.focusMinutes}
                                        onChange={(event) =>
                                            persistConfig({ ...config, focusMinutes: Number(event.target.value) || 1 })
                                        }
                                    />
                                </div>
                                <div>
                                    <label htmlFor="config-short">Short break (min)</label>
                                    <input
                                        id="config-short"
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={config.shortBreakMinutes}
                                        onChange={(event) =>
                                            persistConfig({ ...config, shortBreakMinutes: Number(event.target.value) || 1 })
                                        }
                                    />
                                </div>
                                <div>
                                    <label htmlFor="config-long">Long break (min)</label>
                                    <input
                                        id="config-long"
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={config.longBreakMinutes}
                                        onChange={(event) =>
                                            persistConfig({ ...config, longBreakMinutes: Number(event.target.value) || 1 })
                                        }
                                    />
                                </div>
                                <div>
                                    <label htmlFor="config-cycle">Sesiones antes del long break</label>
                                    <input
                                        id="config-cycle"
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={config.sessionsBeforeLongBreak}
                                        onChange={(event) =>
                                            persistConfig({ ...config, sessionsBeforeLongBreak: Number(event.target.value) || 1 })
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className="animate-in">
                <h2>Tu foco</h2>
                <div className="focus-stat-row">
                    <div className="card stat-tile">
                        <span className="eyebrow">Hoy</span>
                        <span className="stat-tile-value">{todayMinutes} min</span>
                    </div>
                    <div className="card stat-tile">
                        <span className="eyebrow">Esta semana</span>
                        <span className="stat-tile-value">{weekMinutes} min</span>
                    </div>
                    <div className="card stat-tile">
                        <span className="eyebrow">Este mes</span>
                        <span className="stat-tile-value">{monthMinutes} min</span>
                    </div>
                    <div className="card stat-tile">
                        <span className="eyebrow">Total</span>
                        <span className="stat-tile-value">{totalMinutes} min</span>
                    </div>
                </div>
            </section>

            <section className="card animate-in">
                <h2>Foco esta semana</h2>
                <BarChart data={weeklyBars.map((bar) => ({ label: bar.label, value: bar.minutes }))} />
            </section>

            <section className="card animate-in">
                <h2>Estadísticas</h2>
                <ul className="focus-stats-list">
                    <li>
                        <span className="text-muted">Sesión más larga</span>
                        <span>{longestSession} min</span>
                    </li>
                    <li>
                        <span className="text-muted">Sesiones completadas</span>
                        <span>{completedCount}</span>
                    </li>
                    <li>
                        <span className="text-muted">Sesiones interrumpidas</span>
                        <span>{interruptedCount}</span>
                    </li>
                    <li>
                        <span className="text-muted">Mejor día</span>
                        <span>{best ? `${best.dateKey} · ${best.minutes} min` : "—"}</span>
                    </li>
                    <li>
                        <span className="text-muted">Hora más productiva</span>
                        <span>{productiveHour !== null ? formatHour(productiveHour) : "—"}</span>
                    </li>
                </ul>
            </section>
        </div>
    );
}

export default FocusPage;
