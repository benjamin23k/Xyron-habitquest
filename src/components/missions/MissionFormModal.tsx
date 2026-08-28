import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "../Modal";
import Button from "../ui/Button";
import type { MissionDifficulty, MissionFrequency, NewMissionInput } from "../../services/missionService";

const DIFFICULTY_OPTIONS: { value: MissionDifficulty; label: string }[] = [
    { value: "easy", label: "Easy · +10 XP" },
    { value: "medium", label: "Normal · +25 XP" },
    { value: "hard", label: "Hard · +50 XP" },
    { value: "epic", label: "Epic · +100 XP" },
    { value: "legendary", label: "Legendary · +250 XP" }
];

const FREQUENCY_OPTIONS: { value: MissionFrequency; label: string }[] = [
    { value: "daily", label: "Diaria" },
    { value: "weekly", label: "Semanal" },
    { value: "monthly", label: "Mensual" },
    { value: "once", label: "Única vez" },
    { value: "challenge", label: "Challenge" }
];

interface MissionFormModalProps {
    availableStats: string[];
    onSubmit: (input: NewMissionInput) => Promise<void>;
    onClose: () => void;
}

function MissionFormModal({ availableStats, onSubmit, onClose }: MissionFormModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [stat, setStat] = useState(availableStats[0] ?? "");
    const [difficulty, setDifficulty] = useState<MissionDifficulty>("easy");
    const [frequency, setFrequency] = useState<MissionFrequency>("daily");
    const [dueDate, setDueDate] = useState("");
    const [estimatedMinutes, setEstimatedMinutes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setError("Ponele un nombre a la misión.");
            return;
        }

        if (!stat) {
            setError("Elegí qué atributo mejora esta misión.");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            await onSubmit({
                title: trimmedTitle,
                description: description.trim(),
                category: category.trim(),
                stat,
                difficulty,
                frequency,
                // "T00:00:00" (sin sufijo Z) fuerza a interpretar el valor del
                // input como medianoche LOCAL, no UTC — si no, en zonas
                // horarias detrás de UTC la fecha mostrada después podía
                // aparecer un día antes de la elegida (mismo criterio que
                // systems/date.ts usa para toDateKey/daysBetween).
                dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
                estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear la misión.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal title="Nueva misión" onClose={onClose}>
            <form onSubmit={handleSubmit} className="stacked-form">
                <label htmlFor="mission-title">Nombre</label>
                <input
                    id="mission-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ej: Meditar 10 minutos"
                    autoFocus
                />

                <label htmlFor="mission-description">Descripción (opcional)</label>
                <textarea
                    id="mission-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Ej: Sesión de meditación guiada antes de dormir."
                    rows={2}
                />

                <div className="stacked-form-row">
                    <div>
                        <label htmlFor="mission-difficulty">Dificultad</label>
                        <select
                            id="mission-difficulty"
                            value={difficulty}
                            onChange={(event) => setDifficulty(event.target.value as MissionDifficulty)}
                        >
                            {DIFFICULTY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="mission-frequency">Repetición</label>
                        <select
                            id="mission-frequency"
                            value={frequency}
                            onChange={(event) => setFrequency(event.target.value as MissionFrequency)}
                        >
                            {FREQUENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <label htmlFor="mission-stat">Atributo a mejorar</label>
                <select id="mission-stat" value={stat} onChange={(event) => setStat(event.target.value)}>
                    {availableStats.map((statName) => (
                        <option key={statName} value={statName}>
                            {statName}
                        </option>
                    ))}
                </select>

                <label htmlFor="mission-category">Categoría (opcional)</label>
                <input
                    id="mission-category"
                    type="text"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Ej: Salud, Estudio, Trabajo"
                />

                <div className="stacked-form-row">
                    <div>
                        <label htmlFor="mission-due-date">Fecha límite (opcional)</label>
                        <input
                            id="mission-due-date"
                            type="date"
                            value={dueDate}
                            onChange={(event) => setDueDate(event.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="mission-estimated-minutes">Minutos estimados (opcional)</label>
                        <input
                            id="mission-estimated-minutes"
                            type="number"
                            min={1}
                            max={600}
                            value={estimatedMinutes}
                            onChange={(event) => setEstimatedMinutes(event.target.value)}
                            placeholder="Ej: 25"
                        />
                    </div>
                </div>

                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}

                <Button type="submit" variant="primary" loading={submitting}>
                    Crear misión
                </Button>
            </form>
        </Modal>
    );
}

export default MissionFormModal;
