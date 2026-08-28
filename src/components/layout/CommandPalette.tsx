import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "./navItems";

interface CommandPaletteProps {
    onClose: () => void;
}

interface PaletteAction {
    id: string;
    label: string;
    icon: Icon;
    run: () => void;
}

function CommandPalette({ onClose }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const actions: PaletteAction[] = useMemo(() => {
        const navActions = [...NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map((item) => ({
            id: `nav-${item.to}`,
            label: `Ir a ${item.label}`,
            icon: item.icon,
            run: () => navigate(item.to)
        }));

        return [
            {
                id: "new-mission",
                label: "Nueva misión",
                icon: Plus,
                run: () => navigate("/missions?new=1")
            },
            ...navActions
        ];
    }, [navigate]);

    const filtered = actions.filter((action) => action.label.toLowerCase().includes(query.trim().toLowerCase()));

    function execute(action: PaletteAction) {
        action.run();
        onClose();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Escape") {
            onClose();
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (event.key === "Enter") {
            event.preventDefault();
            const action = filtered[selectedIndex];
            if (action) {
                execute(action);
            }
        }
    }

    return (
        <div className="command-palette-overlay" onClick={onClose}>
            <div
                className="command-palette"
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className="command-palette-search">
                    <MagnifyingGlass size={18} aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Buscar una acción..."
                        aria-label="Comandos"
                    />
                    <kbd className="command-palette-kbd">Esc</kbd>
                </div>

                <ul className="command-palette-list">
                    {filtered.length === 0 && <li className="command-palette-empty">Sin resultados.</li>}

                    {filtered.map((action, index) => {
                        const ActionIcon = action.icon;
                        return (
                            <li
                                key={action.id}
                                className={
                                    index === selectedIndex
                                        ? "command-palette-item command-palette-item--active"
                                        : "command-palette-item"
                                }
                                onMouseEnter={() => setSelectedIndex(index)}
                                onClick={() => execute(action)}
                            >
                                <ActionIcon size={18} aria-hidden="true" />
                                {action.label}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default CommandPalette;
