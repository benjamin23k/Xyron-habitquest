import { Coins, X } from "@phosphor-icons/react";
import type { Quest } from "../../data/quests";
import type { BadgeVariant } from "../ui/Badge";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

interface MissionCardProps {
    quest: Quest;
    kind: "daily" | "custom";
    isCompleted: boolean;
    onComplete: (questId: string) => void;
    onRemove?: (questId: string) => void;
}

const DIFFICULTY_LABEL: Record<Quest["difficulty"], string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    epic: "Epic"
};

function MissionCard({ quest, kind, isCompleted, onComplete, onRemove }: MissionCardProps) {
    const badgeVariant = quest.difficulty as BadgeVariant;

    return (
        <li className={isCompleted ? "mission-card mission-card--completed" : "mission-card"}>
            <div className="mission-card-top">
                <span className="eyebrow">{kind === "daily" ? "Misión diaria" : "Misión personalizada"}</span>
                <Badge variant={badgeVariant}>{DIFFICULTY_LABEL[quest.difficulty]}</Badge>
            </div>

            <h3 className="mission-card-title">{quest.title}</h3>

            {quest.description && <p className="mission-card-description">{quest.description}</p>}

            <div className="mission-card-rewards">
                <span className="mission-reward mission-reward--xp">+{quest.xpReward} XP</span>
                <span className="mission-reward mission-reward--coins">
                    +{quest.coinReward} <Coins size={14} weight="fill" aria-hidden="true" />
                </span>
                <span className="mission-reward">
                    +{quest.statReward} {quest.stat}
                </span>
            </div>

            <div className="mission-card-actions">
                <Button
                    type="button"
                    variant="primary"
                    onClick={() => onComplete(quest.id)}
                    disabled={isCompleted}
                    aria-pressed={isCompleted}
                >
                    {isCompleted ? "Completada hoy" : "Completar"}
                </Button>

                {onRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(quest.id)}
                        aria-label={`Eliminar misión "${quest.title}"`}
                    >
                        <X size={16} aria-hidden="true" />
                    </Button>
                )}
            </div>
        </li>
    );
}

export default MissionCard;
