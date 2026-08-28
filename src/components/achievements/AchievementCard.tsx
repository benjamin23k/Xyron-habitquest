import { Lock } from "@phosphor-icons/react";
import type { Achievement } from "../../data/achievements";
import IconGlyph from "../ui/IconGlyph";

interface AchievementCardProps {
    achievement: Achievement;
    isUnlocked: boolean;
}

function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
    return (
        <li className={isUnlocked ? "achievement-card achievement-card--unlocked" : "achievement-card"}>
            <span className="achievement-card-icon" aria-hidden="true">
                {isUnlocked ? <IconGlyph iconKey={achievement.icon} size={28} weight="fill" /> : <Lock size={28} />}
            </span>
            <h3>{isUnlocked ? achievement.title : "???"}</h3>
            <p>{isUnlocked ? achievement.description : "Seguí jugando para descubrir este logro."}</p>
            <span className="achievement-card-status">{isUnlocked ? "Desbloqueado" : "Bloqueado"}</span>
        </li>
    );
}

export default AchievementCard;
