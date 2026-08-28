// El perfil del personaje ahora vive en Supabase (tablas `profiles` y `stats`).
// Este archivo solo conserva el shape que StatsRadar y AttributeCard esperan.
export interface Stat {
    name: string;
    value: number;
    maxValue: number;
}
