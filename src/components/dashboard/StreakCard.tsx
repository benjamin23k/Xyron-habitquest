import { Fire } from "@phosphor-icons/react";
import { toDateKey } from "../../systems/date";
import type { StreakSummary } from "../../systems/streak";

interface StreakCardProps {
    streak: StreakSummary;
    activeDateKeys: string[];
}

const MESSAGES: { min: number; text: string }[] = [
    { min: 14, text: "Sos imparable." },
    { min: 7, text: "Estás en llamas." },
    { min: 3, text: "Vas agarrando ritmo." },
    { min: 1, text: "Arrancaste — no aflojes." },
    { min: 0, text: "Completá una misión o hábito hoy para empezar tu racha." }
];

function getMessage(current: number): string {
    const tier = MESSAGES.find((candidate) => current >= candidate.min);
    return tier ? tier.text : MESSAGES[MESSAGES.length - 1].text;
}

function StreakCard({ streak, activeDateKeys }: StreakCardProps) {
    const activeSet = new Set(activeDateKeys);
    const today = new Date();

    const last7 = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - index));
        return activeSet.has(toDateKey(date));
    });

    return (
        <section className="card streak-card animate-in">
            <div className="streak-card-header">
                <span className="streak-card-flame" aria-hidden="true">
                    <Fire size={32} weight="fill" />
                </span>
                <div>
                    <h2>
                        {streak.current} {streak.current === 1 ? "día" : "días"} de racha
                    </h2>
                    <p className="text-muted">{getMessage(streak.current)}</p>
                </div>
            </div>

            <div className="streak-chain" aria-hidden="true">
                {last7.map((active, index) => (
                    <span key={index} className={active ? "streak-chain-day streak-chain-day--active" : "streak-chain-day"} />
                ))}
            </div>

            <p className="streak-card-best">
                Mejor racha: {streak.longest} {streak.longest === 1 ? "día" : "días"}
            </p>
        </section>
    );
}

export default StreakCard;
