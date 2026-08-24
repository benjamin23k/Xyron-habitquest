import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import CharacterHeader from "./components/CharacterHeader";
import XPBar from "./components/XPBar";
import StatsRadar from "./components/StatsRadar";
import StatsManager from "./components/StatsManager";
import character from "./data/character";
import "./App.css";



function App() {
    const [stats, setStats] = useState(character.stats);

    return (
        <main className="app">

            <header className="topbar">
                <h1 className="logo">XYRON</h1>

                <span className="version">
                    LIFE RPG
                </span>
            </header>

            <section className="dashboard">

                <div className="character-section">
                    <CharacterHeader />
                </div>

                <div className="progress-section">
                    <XPBar />
                </div>

                <StatsRadar stats={stats} />
                <StatsManager
                     stats={stats}
                     setStats={setStats}
                         />

            </section>

        </main>
    );
   
}
export default App;