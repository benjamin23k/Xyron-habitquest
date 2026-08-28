// Título puramente de presentación derivado del nivel — no toca profiles.rank
// en la base (ese campo queda libre para un futuro sistema de rangos "de verdad").
const RANK_TIERS: { minLevel: number; label: string }[] = [
    { minLevel: 30, label: "Leyenda" },
    { minLevel: 20, label: "Héroe" },
    { minLevel: 10, label: "Aventurero" },
    { minLevel: 5, label: "Aprendiz" },
    { minLevel: 1, label: "Novato" }
];

export function getRankForLevel(level: number): string {
    const tier = RANK_TIERS.find((candidate) => level >= candidate.minLevel);
    return tier ? tier.label : "Novato";
}
