import { useState } from "react";
import type { FormEvent } from "react";
import Button from "../ui/Button";

interface CustomMissionFormProps {
    availableStats: string[];
    onAdd: (title: string, stat: string) => void;
}

function CustomMissionForm({ availableStats, onAdd }: CustomMissionFormProps) {
    const [title, setTitle] = useState("");
    const [stat, setStat] = useState(availableStats[0] ?? "");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmed = title.trim();
        if (!trimmed || !stat) {
            return;
        }

        onAdd(trimmed, stat);
        setTitle("");
    }

    return (
        <form onSubmit={handleSubmit} className="custom-quest-form">
            <label htmlFor="custom-quest-title" className="sr-only">
                Nombre de la misión
            </label>
            <input
                id="custom-quest-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej: Meditar 10 minutos"
            />

            <label htmlFor="custom-quest-stat" className="sr-only">
                Atributo a mejorar
            </label>
            <select id="custom-quest-stat" value={stat} onChange={(event) => setStat(event.target.value)}>
                {availableStats.map((statName) => (
                    <option key={statName} value={statName}>
                        {statName}
                    </option>
                ))}
            </select>

            <Button type="submit" variant="primary">
                Agregar misión
            </Button>
        </form>
    );
}

export default CustomMissionForm;
