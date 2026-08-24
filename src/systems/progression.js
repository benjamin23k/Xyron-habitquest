
export function getXpRequired(level) {
    const baseXp = 100;
    const growth = 1.2;

    return Math.floor(baseXp * Math.pow(growth, level - 1));
}

export function getProgression(totalXp) {
    let level = 1;
    let xpRemaining = totalXp;

    while (xpRemaining >= getXpRequired(level)) {
        xpRemaining -= getXpRequired(level);
        level++;
    }

    const xpRequired = getXpRequired(level);
    const progress = (xpRemaining / xpRequired) * 100;

    return {
        level,
        currentXp: xpRemaining,
        xpRequired, 
        progress
    };
}