import { useState } from "react";
import { MagnifyingGlass, Repeat } from "@phosphor-icons/react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import HabitCard from "../components/habits/HabitCard";
import HabitFormModal from "../components/habits/HabitFormModal";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { computeHabitCompletionRate, computeHabitStreak } from "../systems/habitStats";
import type { HabitFrequency } from "../services/habitService";

const FREQUENCY_FILTER_OPTIONS: { value: HabitFrequency | "all"; label: string }[] = [
    { value: "all", label: "Toda repetición" },
    { value: "daily", label: "Diario" },
    { value: "weekly", label: "Semanal" }
];

function HabitsPage() {
    const {
        habits,
        habitCompletions,
        isHabitCompletedInCurrentPeriod,
        completeHabit,
        addHabit,
        removeHabit,
        displayStats
    } = useDashboardContext();

    const [search, setSearch] = useState("");
    const [frequencyFilter, setFrequencyFilter] = useState<HabitFrequency | "all">("all");
    const [formOpen, setFormOpen] = useState(false);

    const hasActiveFilters = search.trim() !== "" || frequencyFilter !== "all";

    const filteredHabits = habits.filter((habit) => {
        if (search.trim() && !habit.title.toLowerCase().includes(search.trim().toLowerCase())) {
            return false;
        }
        if (frequencyFilter !== "all" && habit.frequency !== frequencyFilter) {
            return false;
        }
        return true;
    });

    function clearFilters() {
        setSearch("");
        setFrequencyFilter("all");
    }

    return (
        <div className="page-stack">
            <section className="animate-in">
                <div className="section-header">
                    <div>
                        <h1>Hábitos</h1>
                        <p className="text-muted">Rutinas que querés sostener en el tiempo — la métrica que importa es la racha.</p>
                    </div>
                    <Button type="button" variant="primary" onClick={() => setFormOpen(true)}>
                        + Nuevo hábito
                    </Button>
                </div>

                <div className="mission-filters">
                    <div className="mission-filters-search">
                        <MagnifyingGlass size={16} aria-hidden="true" />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar hábito..."
                            aria-label="Buscar hábito"
                        />
                    </div>

                    <select
                        value={frequencyFilter}
                        onChange={(event) => setFrequencyFilter(event.target.value as HabitFrequency | "all")}
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
                {habits.length === 0 ? (
                    <EmptyState
                        icon={Repeat}
                        title="Todavía no tenés hábitos"
                        description="Creá el primero — algo simple que quieras sostener todos los días."
                        action={
                            <Button type="button" variant="primary" size="sm" onClick={() => setFormOpen(true)}>
                                + Nuevo hábito
                            </Button>
                        }
                    />
                ) : filteredHabits.length > 0 ? (
                    <ul className="mission-grid">
                        {filteredHabits.map((habit) => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                streak={computeHabitStreak(habit.id, habitCompletions)}
                                completionRate={computeHabitCompletionRate(habit, habitCompletions)}
                                isCompleted={isHabitCompletedInCurrentPeriod(habit.id)}
                                onComplete={completeHabit}
                                onRemove={removeHabit}
                            />
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={MagnifyingGlass}
                        title="Ningún hábito coincide"
                        description="Probá con otro texto o limpiá los filtros."
                    />
                )}
            </section>

            {formOpen && (
                <HabitFormModal
                    availableStats={displayStats.map((stat) => stat.name)}
                    onSubmit={addHabit}
                    onClose={() => setFormOpen(false)}
                />
            )}
        </div>
    );
}

export default HabitsPage;
