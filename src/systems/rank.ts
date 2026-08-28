// Rango puramente derivado del nivel — no se persiste en la base (profiles.rank
// queda en desuso a favor de este cálculo, ver supabase/migrations/0004). Evita
// duplicar un dato que siempre se puede recalcular a partir de profiles.level.
const RANK_TIERS: { minLevel: number; label: string }[] = [
    { minLevel: 45, label: "Mythic" },
    { minLevel: 36, label: "Legend" },
    { minLevel: 28, label: "Grandmaster" },
    { minLevel: 20, label: "Master" },
    { minLevel: 15, label: "Expert" },
    { minLevel: 10, label: "Adept" },
    { minLevel: 5, label: "Apprentice" },
    { minLevel: 1, label: "Novice" }
];

export function getRankForLevel(level: number): string {
    const tier = RANK_TIERS.find((candidate) => level >= candidate.minLevel);
    return tier ? tier.label : "Novice";
}

export function getNextRankTier(level: number): { minLevel: number; label: string } | null {
    const remaining = [...RANK_TIERS].reverse().find((candidate) => level < candidate.minLevel);
    return remaining ?? null;
}
