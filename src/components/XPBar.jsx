import { useState } from "react";
import { getProgression } from "../systems/progression";

function XPBar() {
  const [xp, setXp] = useState(250);

  const progression = getProgression(xp);

  return (
    <div>
      <h2>Nivel {progression.level}</h2>

      <p>
        {progression.currentXp} / {progression.xpRequired} XP
      </p>

      <div
        style={{
          width: "300px",
          height: "20px",
          backgroundColor: "#ddd",
        }}
      >
        <div
          style={{
            width: `${progression.progress}%`,
            height: "100%",
            backgroundColor: "purple",
          }}
        />
      </div>

      <button onClick={() => setXp(xp + 25)}>
        Ganar 25 XP
      </button>
    </div>
  );
}

export default XPBar;