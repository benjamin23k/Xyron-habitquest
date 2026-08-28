import type { Stat } from "../../data/character";
import ProgressBar from "../ui/ProgressBar";

// Solo da nombre a los 6 atributos base — un atributo personalizado del
// usuario simplemente aparece con su propio nombre, sin forzar una etiqueta.
// El build en sí (qué atributos aparecen y en qué orden) surge 100% de las
// acciones reales del usuario, nunca de una clase elegida de antemano.
const BUILD_TITLES: Record<string, string> = {
    Fuerza: "Warrior",
    Inteligencia: "Scholar",
    Disciplina: "Strategist",
    Creatividad: "Creator",
    Enfoque: "Monk",
    Carisma: "Diplomat"
};

interface CharacterBuildProps {
    stats: Stat[];
}

function CharacterBuild({ stats }: CharacterBuildProps) {
    const topStats = [...stats]
        .filter((stat) => stat.maxValue > 0)
        .sort((a, b) => b.value / b.maxValue - a.value / a.maxValue)
        .slice(0, 3);

    if (topStats.length === 0) {
        return null;
    }

    const buildTitle = BUILD_TITLES[topStats[0].name] ?? topStats[0].name;

    return (
        <div className="character-build">
            <span className="eyebrow">Tu build actual</span>
            <h3 className="character-build-title">{buildTitle}</h3>

            <div className="character-build-bars">
                {topStats.map((stat) => (
                    <div key={stat.name} className="character-build-row">
                        <span className="character-build-label">{stat.name}</span>
                        <ProgressBar value={stat.value} max={stat.maxValue} label={`${stat.name}: ${stat.value} de ${stat.maxValue}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CharacterBuild;
