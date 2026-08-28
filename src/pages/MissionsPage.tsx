import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardText, MagnifyingGlass } from "@phosphor-icons/react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import MissionCard from "../components/missions/MissionCard";
import MissionFormModal from "../components/missions/MissionFormModal";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import type { Quest, QuestDifficulty, QuestFrequency } from "../data/quests";

const DIFFICULTY_FILTER_OPTIONS: { value: QuestDifficulty | "all"; label: string }[] = [
    { value: "all", label: "Toda dificultad" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Normal" },
    { value: "hard", label: "Hard" },
    { value: "epic", label: "Epic" },
    { value: "legendary", label: "Legendary" }
];

const FREQUENCY_FILTER_OPTIONS: { value: QuestFrequency | "all"; label: string }[] = [
    { value: "all", label: "Toda repetición" },
    { value: "daily", label: "Diaria" },
    { value: "weekly", label: "Semanal" },
    { value: "monthly", label: "Mensual" },
    { value: "once", label: "Única vez" },
    { value: "challenge", label: "Challenge" }
];

function MissionsPage() {
    const {
        dailyQuests,
        customQuests,
        isCompletedInCurrentPeriod,
        completeMission,
        addCustomMission,
        removeCustomMission,
        displayStats
    } = useDashboardContext();

    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState<QuestDifficulty | "all">("all");
    const [frequencyFilter, setFrequencyFilter] = useState<QuestFrequency | "all">("all");
    const [formOpen, setFormOpen] = useState(false);

    // Soporta el atajo "Nueva misión" del command palette (navega a
    // /missions?new=1) — abre el formulario solo y limpia el parámetro.
    // Efecto legítimo (no "ajuste durante el render"): sincroniza con un
    // sistema externo real, la URL del router vía setSearchParams, que no se
    // puede llamar durante el render.
    useEffect(() => {
        if (searchParams.get("new") === "1") {
            setFormOpen(true);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const hasActiveFilters = search.trim() !== "" || difficultyFilter !== "all" || frequencyFilter !== "all";

    function matchesFilters(quest: Quest): boolean {
        if (search.trim() && !quest.title.toLowerCase().includes(search.trim().toLowerCase())) {
            return false;
        }
        if (difficultyFilter !== "all" && quest.difficulty !== difficultyFilter) {
            return false;
        }
        if (frequencyFilter !== "all" && quest.frequency !== frequencyFilter) {
            return false;
        }
        return true;
    }

    function clearFilters() {
        setSearch("");
        setDifficultyFilter("all");
        setFrequencyFilter("all");
    }

    const filteredDailyQuests = dailyQuests.filter(matchesFilters);
    const filteredCustomQuests = customQuests.filter(matchesFilters);

    return (
        <div className="page-stack">
            <section className="animate-in">
                <div className="section-header">
                    <div>
                        <h1>Misiones</h1>
                        <p className="text-muted">Diarias, semanales, mensuales, únicas o challenges.</p>
                    </div>
                    <Button type="button" variant="primary" onClick={() => setFormOpen(true)}>
                        + Nueva misión
                    </Button>
                </div>

                <div className="mission-filters">
                    <div className="mission-filters-search">
                        <MagnifyingGlass size={16} aria-hidden="true" />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar misión..."
                            aria-label="Buscar misión"
                        />
                    </div>

                    <select
                        value={difficultyFilter}
                        onChange={(event) => setDifficultyFilter(event.target.value as QuestDifficulty | "all")}
                        aria-label="Filtrar por dificultad"
                    >
                        {DIFFICULTY_FILTER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={frequencyFilter}
                        onChange={(event) => setFrequencyFilter(event.target.value as QuestFrequency | "all")}
                        aria-label="Filtrar por repetición"
                    >
                        {FREQUENCY_FILTER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {hasActiveFilters && (
                        <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                            Limpiar filtros
                        </Button>
                    )}
                </div>
            </section>

            <section className="animate-in">
                <h2>Misiones diarias del sistema</h2>

                {filteredDailyQuests.length > 0 ? (
                    <ul className="mission-grid">
                        {filteredDailyQuests.map((quest) => (
                            <MissionCard
                                key={quest.id}
                                quest={quest}
                                kind="daily"
                                isCompleted={isCompletedInCurrentPeriod(quest.id)}
                                onComplete={completeMission}
                            />
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={MagnifyingGlass}
                        title="Ninguna misión diaria coincide"
                        description="Probá con otro texto o limpiá los filtros."
                    />
                )}
            </section>

            <section className="animate-in">
                <h2>Misiones personalizadas</h2>

                {customQuests.length === 0 ? (
                    <EmptyState
                        icon={ClipboardText}
                        title="Tu tablero de misiones está vacío"
                        description="Creá tu primera misión personalizada y sumala a tu progreso."
                        action={
                            <Button type="button" variant="primary" size="sm" onClick={() => setFormOpen(true)}>
                                + Nueva misión
                            </Button>
                        }
                    />
                ) : filteredCustomQuests.length > 0 ? (
                    <ul className="mission-grid">
                        {filteredCustomQuests.map((quest) => (
                            <MissionCard
                                key={quest.id}
                                quest={quest}
                                kind="custom"
                                isCompleted={isCompletedInCurrentPeriod(quest.id)}
                                onComplete={completeMission}
                                onRemove={removeCustomMission}
                            />
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={MagnifyingGlass}
                        title="Ninguna misión personalizada coincide"
                        description="Probá con otro texto o limpiá los filtros."
                    />
                )}
            </section>

            {formOpen && (
                <MissionFormModal
                    availableStats={displayStats.map((stat) => stat.name)}
                    onSubmit={addCustomMission}
                    onClose={() => setFormOpen(false)}
                />
            )}
        </div>
    );
}

export default MissionsPage;
