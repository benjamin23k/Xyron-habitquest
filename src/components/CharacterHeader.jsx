import character from "../data/character";
import { getProgression } from "../systems/progression";


function CharacterHeader() {
    const progression = getProgression(character.xp);

    return (
        <div>
            <h1>{character.name}</h1>

            <p>Nivel {progression.level}</p>

            <p>
                {progression.currentXp} / {progression.xpRequired} XP
            </p>
        </div>
    );
}

export default CharacterHeader;