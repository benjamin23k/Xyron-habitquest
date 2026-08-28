export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
}

const achievements: Achievement[] = [
    {
        id: "first-quest",
        title: "Primer paso",
        description: "Completa tu primera misión.",
        icon: "Medal"
    },
    {
        id: "quest-master",
        title: "Cazador de misiones",
        description: "Completa 3 misiones.",
        icon: "Target"
    },
    {
        id: "all-quests",
        title: "Leyenda viviente",
        description: "Completa todas las misiones disponibles.",
        icon: "Trophy"
    },
    {
        id: "streak-3",
        title: "Constancia",
        description: "Alcanza una racha de 3 días.",
        icon: "Fire"
    },
    {
        id: "streak-7",
        title: "Semana perfecta",
        description: "Alcanza una racha de 7 días.",
        icon: "Lightning"
    },
    {
        id: "level-5",
        title: "Ascenso",
        description: "Llega al nivel 5.",
        icon: "Star"
    },
    {
        id: "balanced",
        title: "Equilibrado",
        description: "Sube todas tus estadísticas al menos una vez.",
        icon: "Compass"
    }
];

export default achievements;
