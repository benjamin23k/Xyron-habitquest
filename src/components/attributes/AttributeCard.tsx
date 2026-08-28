import type { StatRow } from "../../services/profileService";
import Badge from "../ui/Badge";
import ProgressBar from "../ui/ProgressBar";
import Button from "../ui/Button";
import IconGlyph from "../ui/IconGlyph";

interface AttributeCardProps {
    stat: StatRow;
    weeklyGain: number;
    radarDisabled: boolean;
    onToggleRadar: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function AttributeCard({ stat, weeklyGain, radarDisabled, onToggleRadar, onEdit, onDelete }: AttributeCardProps) {
    return (
        <div className="attribute-card animate-in">
            <div className="attribute-card-header">
                <span className="attribute-icon" aria-hidden="true">
                    <IconGlyph iconKey={stat.icon} size={22} weight="fill" />
                </span>
                <h3>{stat.name}</h3>
                <Badge variant={stat.is_default ? "default" : "primary"}>{stat.is_default ? "Base" : "Custom"}</Badge>
            </div>

            {stat.description && <p className="attribute-description">{stat.description}</p>}

            <ProgressBar value={stat.value} max={stat.max_value} label={`${stat.name}: ${stat.value} de ${stat.max_value}`} />
            <span className="attribute-value">
                {stat.value}/{stat.max_value}
            </span>

            {weeklyGain > 0 && <span className="attribute-weekly">+{weeklyGain} esta semana</span>}

            <label className="attribute-radar-toggle">
                <input
                    type="checkbox"
                    checked={stat.in_radar}
                    disabled={!stat.in_radar && radarDisabled}
                    onChange={onToggleRadar}
                />
                En el radar
            </label>

            {!stat.is_default && (
                <div className="attribute-actions">
                    <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
                        Editar
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={onDelete}>
                        Eliminar
                    </Button>
                </div>
            )}
        </div>
    );
}

export default AttributeCard;
