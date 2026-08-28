import { Link } from "react-router-dom";
import { Fire } from "@phosphor-icons/react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import StatsRadar from "../components/StatsRadar";
import StreakCard from "../components/dashboard/StreakCard";
import CoinBalance from "../components/ui/CoinBalance";
import ProgressBar from "../components/ui/ProgressBar";
import Badge from "../components/ui/Badge";
import CharacterNotes from "../components/CharacterNotes";
import { getRankForLevel } from "../systems/rank";

function DashboardPage() {
    const { userId, profile, progression, streak, radarStats, questLog } = useDashboardContext();
    const rank = getRankForLevel(progression.level);

    return (
        <div className="page-stack">
            <section className="card player-header animate-in">
                <p className="eyebrow">Bienvenido de nuevo</p>
                <h1>{profile.name}</h1>

                <div className="player-header-progress">
                    <span className="player-header-level">Nivel {progression.level}</span>
                    <ProgressBar
                        value={progression.currentXp}
                        max={progression.xpRequired}
                        variant="xp"
                        size="lg"
                        label={`${progression.currentXp} de ${progression.xpRequired} XP`}
                    />
                    <span className="text-muted">
                        {progression.currentXp} / {progression.xpRequired} XP
                    </span>
                </div>

                <Badge variant="primary">{rank.toUpperCase()}</Badge>
            </section>

            <div className="stat-tile-row">
                <div className="card stat-tile animate-in">
                    <span className="eyebrow">Monedas</span>
                    <CoinBalance coins={profile.coins} size="lg" />
                </div>

                <div className="card stat-tile animate-in">
                    <span className="eyebrow">Racha</span>
                    <span className="stat-tile-value">
                        <Fire size={18} weight="fill" aria-hidden="true" /> {streak.current} {streak.current === 1 ? "día" : "días"}
                    </span>
                </div>
            </div>

            <StreakCard streak={streak} activeDateKeys={questLog.map((entry) => entry.dateKey)} />

            <section className="card animate-in">
                <div className="section-header">
                    <h2>Atributos</h2>
                    <Link to="/attributes" className="btn btn--secondary btn--sm">
                        Configurar radar
                    </Link>
                </div>
                <StatsRadar stats={radarStats} />
            </section>

            <CharacterNotes userId={userId} />
        </div>
    );
}

export default DashboardPage;
