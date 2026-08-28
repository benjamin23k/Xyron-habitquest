import { useEffect, useRef, useState } from "react";
import ProgressBar from "../ui/ProgressBar";

interface XpProgressProps {
    currentXp: number;
    xpRequired: number;
    // Identificador estable de "cuánta experiencia total lleva el personaje".
    // Se usa (en vez de currentXp solo) para no confundir un level-up —donde
    // currentXp vuelve a empezar cerca de 0— con una pérdida de XP.
    totalXp: number;
}

// Mismo patrón que CoinBalance: guarda el valor anterior en un ref y muestra
// un "+N XP" flotante cuando cambia, sin necesitar ningún estado global de
// animación.
function XpProgress({ currentXp, xpRequired, totalXp }: XpProgressProps) {
    const previous = useRef(totalXp);
    const [delta, setDelta] = useState<number | null>(null);

    useEffect(() => {
        const diff = totalXp - previous.current;
        previous.current = totalXp;

        if (diff <= 0) {
            return;
        }

        setDelta(diff);
        const timer = setTimeout(() => setDelta(null), 1600);
        return () => clearTimeout(timer);
    }, [totalXp]);

    return (
        <div className="xp-progress">
            <ProgressBar
                value={currentXp}
                max={xpRequired}
                variant="xp"
                size="lg"
                label={`${currentXp} de ${xpRequired} XP`}
            />
            {delta !== null && (
                <span className="xp-progress-delta" aria-hidden="true">
                    +{delta} XP
                </span>
            )}
        </div>
    );
}

export default XpProgress;
