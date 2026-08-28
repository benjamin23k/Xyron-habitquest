import { useState } from "react";
import type { FormEvent } from "react";
import { NotePencil, Trophy, WarningCircle, Target, X } from "@phosphor-icons/react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import { useJournal } from "../hooks/useJournal";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import type { Mood } from "../services/journalService";
import { toDateKey } from "../systems/date";

const MOOD_OPTIONS: { value: Mood; label: string }[] = [
    { value: "great", label: "Excelente" },
    { value: "good", label: "Bien" },
    { value: "okay", label: "Normal" },
    { value: "bad", label: "Mal" },
    { value: "terrible", label: "Terrible" }
];

function moodLabel(mood: Mood | null): string | null {
    return MOOD_OPTIONS.find((option) => option.value === mood)?.label ?? null;
}

function formatEntryDate(dateKey: string): string {
    const text = new Date(`${dateKey}T00:00:00`).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function JournalPage() {
    const { userId } = useDashboardContext();
    const { entries, loading, error: loadError, addEntry, removeEntry } = useJournal(userId);

    const [mood, setMood] = useState<Mood | null>(null);
    const [reflection, setReflection] = useState("");
    const [wins, setWins] = useState("");
    const [problems, setProblems] = useState("");
    const [goals, setGoals] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!reflection.trim() && !wins.trim() && !problems.trim() && !goals.trim()) {
            setError("Escribí algo antes de guardar.");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            await addEntry(userId, {
                mood,
                reflection,
                wins,
                problems,
                goals,
                entryDate: toDateKey(new Date())
            });
            setMood(null);
            setReflection("");
            setWins("");
            setProblems("");
            setGoals("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar la entrada.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="page-stack">
            <section className="animate-in">
                <h1>Journal</h1>
                <p className="text-muted">Reflexión, ánimo, victorias y metas — a tu ritmo.</p>
            </section>

            <form onSubmit={handleSubmit} className="card stacked-form animate-in">
                <span className="stacked-form-label">¿Cómo estuvo tu día?</span>
                <div className="mood-picker" role="radiogroup" aria-label="Estado de ánimo">
                    {MOOD_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={mood === option.value}
                            className={
                                mood === option.value
                                    ? `mood-option mood-option--${option.value} mood-option--selected`
                                    : `mood-option mood-option--${option.value}`
                            }
                            onClick={() => setMood((prev) => (prev === option.value ? null : option.value))}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <label htmlFor="journal-reflection">Reflexión</label>
                <textarea
                    id="journal-reflection"
                    value={reflection}
                    onChange={(event) => setReflection(event.target.value)}
                    placeholder="¿Qué tenés en mente hoy?"
                    rows={3}
                />

                <label htmlFor="journal-wins">Victorias (opcional)</label>
                <input
                    id="journal-wins"
                    type="text"
                    value={wins}
                    onChange={(event) => setWins(event.target.value)}
                    placeholder="Ej: Terminé el informe antes de tiempo"
                />

                <label htmlFor="journal-problems">Problemas (opcional)</label>
                <input
                    id="journal-problems"
                    type="text"
                    value={problems}
                    onChange={(event) => setProblems(event.target.value)}
                    placeholder="Ej: Me costó concentrarme a la tarde"
                />

                <label htmlFor="journal-goals">Metas (opcional)</label>
                <input
                    id="journal-goals"
                    type="text"
                    value={goals}
                    onChange={(event) => setGoals(event.target.value)}
                    placeholder="Ej: Retomar la rutina de sueño"
                />

                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}

                <Button type="submit" variant="primary" loading={submitting}>
                    Guardar entrada
                </Button>
            </form>

            <section className="animate-in">
                <h2>Historial</h2>

                {loadError && (
                    <p className="auth-error" role="alert">
                        {loadError}
                    </p>
                )}

                {!loading && entries.length === 0 ? (
                    <EmptyState
                        icon={NotePencil}
                        title="Tu journal está vacío"
                        description="Escribí tu primera entrada arriba."
                    />
                ) : (
                    <ul className="journal-list">
                        {entries.map((entry) => (
                            <li key={entry.id} className="card journal-entry">
                                <div className="journal-entry-header">
                                    <span className="journal-entry-date">{formatEntryDate(entry.entry_date)}</span>
                                    {entry.mood && (
                                        <span className={`mood-pill mood-pill--${entry.mood}`}>{moodLabel(entry.mood)}</span>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeEntry(entry.id)}
                                        aria-label="Eliminar entrada"
                                    >
                                        <X size={14} aria-hidden="true" />
                                    </Button>
                                </div>

                                {entry.reflection && <p className="journal-entry-reflection">{entry.reflection}</p>}

                                {(entry.wins || entry.problems || entry.goals) && (
                                    <div className="journal-entry-chips">
                                        {entry.wins && (
                                            <span className="journal-chip journal-chip--wins">
                                                <Trophy size={12} weight="fill" aria-hidden="true" /> {entry.wins}
                                            </span>
                                        )}
                                        {entry.problems && (
                                            <span className="journal-chip journal-chip--problems">
                                                <WarningCircle size={12} weight="fill" aria-hidden="true" /> {entry.problems}
                                            </span>
                                        )}
                                        {entry.goals && (
                                            <span className="journal-chip journal-chip--goals">
                                                <Target size={12} weight="fill" aria-hidden="true" /> {entry.goals}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default JournalPage;
