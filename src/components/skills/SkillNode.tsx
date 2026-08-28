import { useState } from "react";
import { CheckCircle, Lock } from "@phosphor-icons/react";
import type { SkillRow } from "../../services/skillService";
import IconGlyph from "../ui/IconGlyph";
import Button from "../ui/Button";
import ConfirmModal from "../ConfirmModal";

interface SkillNodeProps {
    skill: SkillRow;
    isUnlocked: boolean;
    lockedReason: string | null;
    onUnlock: (skillId: string) => Promise<void>;
}

function SkillNode({ skill, isUnlocked, lockedReason, onUnlock }: SkillNodeProps) {
    const [confirming, setConfirming] = useState(false);
    const canUnlock = !isUnlocked && lockedReason === null;

    const className = [
        "skill-node",
        isUnlocked && "skill-node--unlocked",
        !isUnlocked && !canUnlock && "skill-node--locked"
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={className}>
            <span className="skill-node-icon" aria-hidden="true">
                {isUnlocked ? (
                    <IconGlyph iconKey={skill.icon} size={22} weight="fill" />
                ) : canUnlock ? (
                    <IconGlyph iconKey={skill.icon} size={22} />
                ) : (
                    <Lock size={22} />
                )}
            </span>

            <h4 className="skill-node-name">{skill.name}</h4>
            <p className="skill-node-description">{skill.description}</p>

            <span className="skill-node-cost">
                Costo: {skill.cost} {skill.cost === 1 ? "punto" : "puntos"} · Nivel {skill.min_level}+
            </span>

            {isUnlocked ? (
                <span className="skill-node-status skill-node-status--unlocked">
                    <CheckCircle size={14} weight="fill" aria-hidden="true" /> Desbloqueada
                </span>
            ) : canUnlock ? (
                <Button type="button" variant="primary" size="sm" onClick={() => setConfirming(true)}>
                    Desbloquear
                </Button>
            ) : (
                <span className="skill-node-status">{lockedReason}</span>
            )}

            {confirming && (
                <ConfirmModal
                    title={`¿Desbloquear "${skill.name}"?`}
                    description={`Vas a gastar ${skill.cost} ${skill.cost === 1 ? "punto de habilidad" : "puntos de habilidad"}.`}
                    confirmLabel="Desbloquear"
                    confirmVariant="primary"
                    onConfirm={() => onUnlock(skill.id)}
                    onClose={() => setConfirming(false)}
                />
            )}
        </div>
    );
}

export default SkillNode;
