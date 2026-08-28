import { Coins, Fire, X } from "@phosphor-icons/react";
import type { Habit } from "../../services/habitService";
import type { StreakSummary } from "../../systems/streak";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import IconGlyph from "../ui/IconGlyph";

interface HabitCardProps {
    habit: Habit;
    streak: StreakSummary;
    completionRate: number;
    isCompleted: boolean;
    onComplete: (habitId: string) => void;
    onRemove?: (habitId: string) => void;
}

const FREQUENCY_LABEL: Record<Habit["frequency"], string> = {
    daily: "Diario",
    weekly: "Semanal"
};

const COMPLETED_LABEL: Record<Habit["frequency"], string> = {
    daily: "Completado hoy",
    weekly: "Completado esta semana"
};

function HabitCard({ habit, streak, completionRate, isCompleted, onComplete, onRemove }: HabitCardProps) {
    return (
        <li className={isCompleted ? "mission-card mission-card--completed" : "mission-card"}>
            <div className="mission-card-top">
                <span className="eyebrow">Hábito</span>
                <Badge>{FREQUENCY_LABEL[habit.frequency]}</Badge>
            </div>

            <h3 className="mission-card-title">
                {habit.icon && <IconGlyph iconKey={habit.icon} size={18} />} {habit.title}
            </h3>

            {habit.description && <p className="mission-card-description">{habit.description}</p>}

            <div className="mission-card-meta">
                <span className="mission-card-meta-item">
                    <Fire size={13} weight="fill" aria-hidden="true" /> Racha: {streak.current}{" "}
                    {streak.current === 1 ? "día" : "días"}
                </span>
                <span className="mission-card-meta-item">Consistencia: {completionRate}%</span>
            </div>

            <div className="mission-card-rewards">
                <span className="mission-reward mission-reward--xp">+{habit.xp_reward} XP</span>
                <span className="mission-reward mission-reward--coins">
                    +{habit.coin_reward} <Coins size={14} weight="fill" aria-hidden="true" />
                </span>
                {habit.stat && (
                    <span className="mission-reward">
                        +{habit.stat_reward} {habit.stat}
                    </span>
                )}
            </div>

            <div className="mission-card-actions">
                <Button
                    type="button"
                    variant="primary"
                    onClick={() => onComplete(habit.id)}
                    disabled={isCompleted}
                    aria-pressed={isCompleted}
                >
                    {isCompleted ? COMPLETED_LABEL[habit.frequency] : "Completar"}
                </Button>

                {onRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(habit.id)}
                        aria-label={`Eliminar hábito "${habit.title}"`}
                    >
                        <X size={16} aria-hidden="true" />
                    </Button>
                )}
            </div>
        </li>
    );
}

export default HabitCard;
