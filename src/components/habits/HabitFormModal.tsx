import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "../Modal";
import Button from "../ui/Button";
import IconGlyph from "../ui/IconGlyph";
import { ATTRIBUTE_ICON_OPTIONS } from "../../systems/attributeIcons";
import type { HabitFrequency, NewHabitInput } from "../../services/habitService";

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
    { value: "daily", label: "Diario" },
    { value: "weekly", label: "Semanal" }
];

interface HabitFormModalProps {
    availableStats: string[];
    onSubmit: (input: NewHabitInput) => Promise<void>;
    onClose: () => void;
}

function HabitFormModal({ availableStats, onSubmit, onClose }: HabitFormModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState(ATTRIBUTE_ICON_OPTIONS[0].key);
    const [category, setCategory] = useState("");
    const [stat, setStat] = useState(availableStats[0] ?? "");
    const [frequency, setFrequency] = useState<HabitFrequency>("daily");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setError("Ponele un nombre al hábito.");
            return;
        }

        if (!stat) {
            setError("Elegí qué atributo mejora este hábito.");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            await onSubmit({
                title: trimmedTitle,
                description: description.trim(),
                icon,
                category: category.trim(),
                stat,
                frequency
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear el hábito.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal title="Nuevo hábito" onClose={onClose}>
            <form onSubmit={handleSubmit} className="stacked-form">
                <label htmlFor="habit-title">Nombre</label>
                <input
                    id="habit-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ej: Tomar 2 litros de agua"
                    autoFocus
                />

                <label htmlFor="habit-description">Descripción (opcional)</label>
                <textarea
                    id="habit-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Ej: Repartido a lo largo del día."
                    rows={2}
                />

                <span className="stacked-form-label">Icono</span>
                <div className="icon-picker" role="radiogroup" aria-label="Icono del hábito">
                    {ATTRIBUTE_ICON_OPTIONS.map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            role="radio"
                            aria-checked={icon === option.key}
                            aria-label={option.label}
                            title={option.label}
                            className={icon === option.key ? "icon-option icon-option--selected" : "icon-option"}
                            onClick={() => setIcon(option.key)}
                        >
                            <IconGlyph iconKey={option.key} size={20} weight={icon === option.key ? "fill" : "regular"} />
                        </button>
                    ))}
                </div>

                <div className="stacked-form-row">
                    <div>
                        <label htmlFor="habit-frequency">Repetición</label>
                        <select
                            id="habit-frequency"
                            value={frequency}
                            onChange={(event) => setFrequency(event.target.value as HabitFrequency)}
                        >
                            {FREQUENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="habit-stat">Atributo a mejorar</label>
                        <select id="habit-stat" value={stat} onChange={(event) => setStat(event.target.value)}>
                            {availableStats.map((statName) => (
                                <option key={statName} value={statName}>
                                    {statName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <label htmlFor="habit-category">Categoría (opcional)</label>
                <input
                    id="habit-category"
                    type="text"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Ej: Salud, Rutina, Hogar"
                />

                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}

                <Button type="submit" variant="primary" loading={submitting}>
                    Crear hábito
                </Button>
            </form>
        </Modal>
    );
}

export default HabitFormModal;
