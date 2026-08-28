import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "./Modal";
import Button from "./ui/Button";
import IconGlyph from "./ui/IconGlyph";
import { ATTRIBUTE_ICON_OPTIONS } from "../systems/attributeIcons";

export interface AttributeFormValues {
    name: string;
    description: string;
    icon: string;
    maxValue: number;
}

interface AttributeFormModalProps {
    title: string;
    submitLabel: string;
    initialValues?: AttributeFormValues;
    onSubmit: (values: AttributeFormValues) => Promise<void> | void;
    onClose: () => void;
}

function AttributeFormModal({ title, submitLabel, initialValues, onSubmit, onClose }: AttributeFormModalProps) {
    const [name, setName] = useState(initialValues?.name ?? "");
    const [description, setDescription] = useState(initialValues?.description ?? "");
    const [icon, setIcon] = useState(initialValues?.icon ?? ATTRIBUTE_ICON_OPTIONS[0].key);
    const [maxValue, setMaxValue] = useState(initialValues?.maxValue ?? 10);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Ponele un nombre al atributo.");
            return;
        }

        if (maxValue < 1) {
            setError("El valor máximo tiene que ser al menos 1.");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            await onSubmit({ name: trimmedName, description: description.trim(), icon, maxValue });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar el atributo.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal title={title} onClose={onClose}>
            <form onSubmit={handleSubmit} className="attribute-form">
                <label htmlFor="attribute-name">Nombre</label>
                <input
                    id="attribute-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ej: Filosofía"
                    autoFocus
                />

                <label htmlFor="attribute-description">Descripción</label>
                <textarea
                    id="attribute-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Ej: Capacidad para reflexionar y analizar ideas."
                    rows={3}
                />

                <span className="attribute-form-label">Icono</span>
                <div className="icon-picker" role="radiogroup" aria-label="Icono del atributo">
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

                <label htmlFor="attribute-max">Valor máximo</label>
                <input
                    id="attribute-max"
                    type="number"
                    min={1}
                    max={1000}
                    value={maxValue}
                    onChange={(event) => setMaxValue(Number(event.target.value))}
                />

                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}

                <Button type="submit" variant="primary" loading={submitting}>
                    {submitLabel}
                </Button>
            </form>
        </Modal>
    );
}

export default AttributeFormModal;
