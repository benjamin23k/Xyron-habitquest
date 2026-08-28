import { useEffect } from "react";
import { ArrowRight } from "@phosphor-icons/react";

interface LevelUpOverlayProps {
    fromLevel: number;
    toLevel: number;
    onDismiss: () => void;
}

const AUTO_DISMISS_MS = 3200;

function LevelUpOverlay({ fromLevel, toLevel, onDismiss }: LevelUpOverlayProps) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const skillPointsGained = Math.max(0, toLevel - fromLevel);

    return (
        <div className="levelup-overlay" role="status" onClick={onDismiss}>
            <div className="levelup-card">
                <span className="levelup-eyebrow">Level Up</span>
                <div className="levelup-transition">
                    <span className="levelup-old">Nivel {fromLevel}</span>
                    <ArrowRight size={24} weight="bold" aria-hidden="true" />
                    <span className="levelup-new">Nivel {toLevel}</span>
                </div>
                {skillPointsGained > 0 && (
                    <p className="levelup-skill-points">
                        +{skillPointsGained} Skill {skillPointsGained === 1 ? "Point" : "Points"}
                    </p>
                )}
            </div>
        </div>
    );
}

export default LevelUpOverlay;
