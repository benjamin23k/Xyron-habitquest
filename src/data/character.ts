// El perfil del personaje ahora vive en Supabase (tablas `profiles` y `stats`).
// Este archivo solo conserva el shape que StatsRadar, AttributeCard y
// systems/achievements ya esperaban.
export interface Stat {
    name: string;
    value: number;
    maxValue: number;
}
