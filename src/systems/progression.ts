export interface Progression {
    level: number;
    currentXp: number;
    xpRequired: number;
    progress: number;
}

export function getXpRequired(level: number): number {
    const baseXp = 100;
    const growth = 1.2;

    return Math.floor(baseXp * Math.pow(growth, level - 1));
}

export function getProgression(totalXp: number): Progression {
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
