import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Barbell, WarningCircle, TrendUp, Target, X } from "@phosphor-icons/react";
import Button from "./ui/Button";

interface NoteItem {
    id: string;
    text: string;
}

type NoteCategoryKey = "strengths" | "weaknesses" | "improvements" | "toAcquire";

type NotesState = Record<NoteCategoryKey, NoteItem[]>;

const EMPTY_NOTES: NotesState = {
    strengths: [],
    weaknesses: [],
    improvements: [],
    toAcquire: []
};

const CATEGORIES: { key: NoteCategoryKey; title: string; icon: Icon; placeholder: string }[] = [
    { key: "strengths", title: "Fortalezas", icon: Barbell, placeholder: "Ej: Soy constante con el ejercicio" },
    { key: "weaknesses", title: "Debilidades", icon: WarningCircle, placeholder: "Ej: Procrastino en las noches" },
    { key: "improvements", title: "Por mejorar", icon: TrendUp, placeholder: "Ej: Dormir 8 horas por noche" },
    { key: "toAcquire", title: "Por adquirir", icon: Target, placeholder: "Ej: Aprender a hablar en público" }
];

function storageKeyFor(userId: string): string {
    return `xyron:notes:${userId}`;
}

function loadNotes(userId: string): NotesState {
    try {
        const raw = localStorage.getItem(storageKeyFor(userId));
        return raw ? { ...EMPTY_NOTES, ...JSON.parse(raw) } : EMPTY_NOTES;
    } catch {
        return EMPTY_NOTES;
    }
}

interface CharacterNotesProps {
    userId: string;
}

function CharacterNotes({ userId }: CharacterNotesProps) {
    const [loadedForUserId, setLoadedForUserId] = useState(userId);
    const [notes, setNotes] = useState<NotesState>(() => loadNotes(userId));

    // Ajuste durante el render (no en un efecto): si el componente se reutiliza
    // para otra cuenta sin desmontarse, recarga las notas de ESA cuenta antes de
    // pintar, en vez de arrastrar por un instante las de la anterior.
    if (userId !== loadedForUserId) {
        setLoadedForUserId(userId);
        setNotes(loadNotes(userId));
    }

    useEffect(() => {
        localStorage.setItem(storageKeyFor(userId), JSON.stringify(notes));
    }, [userId, notes]);

    function addNote(category: NoteCategoryKey, text: string) {
        const trimmed = text.trim();
        if (!trimmed) {
            return;
        }

        setNotes((prev) => ({
            ...prev,
            [category]: [...prev[category], { id: crypto.randomUUID(), text: trimmed }]
        }));
    }

    function removeNote(category: NoteCategoryKey, id: string) {
        setNotes((prev) => ({
            ...prev,
            [category]: prev[category].filter((note) => note.id !== id)
        }));
    }

    return (
        <div className="notes-board animate-in">
            <h2>Fortalezas, debilidades y metas</h2>

            <div className="notes-grid">
                {CATEGORIES.map((category) => (
                    <NoteColumn
                        key={category.key}
                        categoryKey={category.key}
                        title={category.title}
                        icon={category.icon}
                        placeholder={category.placeholder}
                        items={notes[category.key]}
                        onAdd={(text) => addNote(category.key, text)}
                        onRemove={(id) => removeNote(category.key, id)}
                    />
                ))}
            </div>
        </div>
    );
}

interface NoteColumnProps {
    categoryKey: string;
    title: string;
    icon: Icon;
    placeholder: string;
    items: NoteItem[];
    onAdd: (text: string) => void;
    onRemove: (id: string) => void;
}

function NoteColumn({ categoryKey, title, icon: CategoryIcon, placeholder, items, onAdd, onRemove }: NoteColumnProps) {
    const [text, setText] = useState("");
    const inputId = `note-${categoryKey}`;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onAdd(text);
        setText("");
    }

    return (
        <div className="note-column">
            <h3>
                <CategoryIcon size={18} aria-hidden="true" /> {title}
            </h3>

            <ul className="note-list">
                {items.length === 0 && <li className="note-empty">Todavía no agregaste nada.</li>}

                {items.map((item) => (
                    <li key={item.id} className="note-item">
                        <span>{item.text}</span>
                        <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            aria-label={`Eliminar "${item.text}"`}
                        >
                            <X size={14} weight="bold" aria-hidden="true" />
                        </button>
                    </li>
                ))}
            </ul>

            <form onSubmit={handleSubmit} className="note-form">
                <label htmlFor={inputId} className="sr-only">
                    Agregar a {title}
                </label>
                <input
                    id={inputId}
                    type="text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={placeholder}
                />
                <Button type="submit" variant="primary" size="sm">
                    Agregar
                </Button>
            </form>
        </div>
    );
}

export default CharacterNotes;
