import { Lock } from "@phosphor-icons/react";
import type { AchievementRow } from "../../services/progressionService";
import Badge from "../ui/Badge";
import IconGlyph from "../ui/IconGlyph";

interface AchievementCardProps {
    achievement: AchievementRow;
    isUnlocked: boolean;
}

const RARITY_LABEL: Record<AchievementRow["rarity"], string> = {
    common: "Common",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
    mythic: "Mythic"
};

function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
    // Un logro oculto no desbloqueado se esconde por completo ("???"); uno
    // visible no desbloqueado sí muestra su nombre/descripción como objetivo,
    // solo con el candado en vez del ícono.
    const revealed = isUnlocked || !achievement.is_hidden;

    return (
        <li className={isUnlocked ? "achievement-card achievement-card--unlocked" : "achievement-card"}>
            <span className="achievement-card-icon" aria-hidden="true">
                {isUnlocked ? <IconGlyph iconKey={achievement.icon} size={28} weight="fill" /> : <Lock size={28} />}
            </span>
            <h3>{revealed ? achievement.name : "???"}</h3>
            <p>{revealed ? achievement.description : "Seguí jugando para descubrir este logro."}</p>
            <div className="achievement-card-footer">
                {revealed && <Badge variant={achievement.rarity}>{RARITY_LABEL[achievement.rarity]}</Badge>}
                <span className="achievement-card-status">{isUnlocked ? "Desbloqueado" : "Bloqueado"}</span>
            </div>
        </li>
    );
}

export default AchievementCard;
