// Las misiones ahora viven en Supabase (tabla `missions`). Este tipo se mantiene
// porque los componentes de misiones siguen trabajando con esta forma; AppLayout
// adapta las filas de Supabase (Mission, en services/missionService.ts) a este
// shape antes de pasarlas a los componentes, así ninguno conoce el esquema real.
export type QuestDifficulty = "easy" | "medium" | "hard" | "epic" | "legendary";
export type QuestFrequency = "daily" | "weekly" | "monthly" | "once" | "challenge";

export interface Quest {
    id: string;
    title: string;
    description?: string;
    stat: string;
    statReward: number;
    xpReward: number;
    coinReward: number;
    difficulty: QuestDifficulty;
    frequency: QuestFrequency;
    dueDate?: string;
    estimatedMinutes?: number;
}
