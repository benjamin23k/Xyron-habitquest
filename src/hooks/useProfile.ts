import { useEffect, useState } from "react";
import type { NewStatInput, Profile, ProfileUpdate, StatRow, StatUpdateInput } from "../services/profileService";
import { addCustomStat, deleteStat, fetchProfile, fetchStats, updateProfile, updateStat } from "../services/profileService";
import type { CompleteMissionResult } from "../services/missionService";

interface UseProfileResult {
    profile: Profile | null;
    stats: StatRow[];
    loading: boolean;
    error: string | null;
    addStat: (input: NewStatInput) => Promise<void>;
    editStat: (statId: string, updates: StatUpdateInput) => Promise<void>;
    removeStat: (statId: string) => Promise<void>;
    editProfile: (updates: ProfileUpdate) => Promise<void>;
    applyMissionReward: (result: CompleteMissionResult) => void;
}

export function useProfile(userId: string | null): UseProfileResult {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<StatRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Bandera de cancelación: si userId cambia (o el componente se desmonta)
        // antes de que esta carga termine, ignoramos su resultado. Sin esto, dos
        // cargas en vuelo (p. ej. las dos invocaciones del efecto que hace
        // StrictMode en desarrollo) podían resolver en cualquier orden y una
        // respuesta vieja terminaba pisando el estado de una más nueva.
        let ignore = false;

        async function load() {
            if (!userId) {
                setProfile(null);
                setStats([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [profileData, statsData] = await Promise.all([
                    fetchProfile(userId),
                    fetchStats(userId)
                ]);

                if (!ignore) {
                    setProfile(profileData);
                    setStats(statsData);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "No se pudo cargar el perfil.");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            ignore = true;
        };
    }, [userId]);

    async function addStat(input: NewStatInput) {
        if (!userId) {
            return;
        }

        const trimmed = input.name.trim();
        if (!trimmed) {
            return;
        }

        const newStat = await addCustomStat(userId, { ...input, name: trimmed });
        setStats((prev) => [...prev, newStat]);
    }

    async function editStat(statId: string, updates: StatUpdateInput) {
        const updated = await updateStat(statId, updates);
        setStats((prev) => prev.map((stat) => (stat.id === statId ? updated : stat)));
    }

    async function removeStat(statId: string) {
        await deleteStat(statId);
        setStats((prev) => prev.filter((stat) => stat.id !== statId));
    }

    async function editProfile(updates: ProfileUpdate) {
        if (!userId) {
            return;
        }

        const updated = await updateProfile(userId, updates);
        setProfile(updated);
    }

    // Aplica el resultado que ya devolvió complete_mission() sin volver a pedir
    // el perfil entero: la fila real en Supabase ya quedó correcta, esto solo
    // evita un round-trip extra para que la UI se sienta instantánea.
    function applyMissionReward(result: CompleteMissionResult) {
        setProfile((prev) =>
            prev
                ? {
                      ...prev,
                      xp: result.new_xp,
                      level: result.new_level,
                      coins: prev.coins + result.coins_gained
                  }
                : prev
        );

        if (result.stat) {
            setStats((prev) =>
                prev.map((stat) =>
                    stat.name === result.stat
                        ? { ...stat, value: Math.min(stat.value + result.stat_gained, stat.max_value) }
                        : stat
                )
            );
        }
    }

    return { profile, stats, loading, error, addStat, editStat, removeStat, editProfile, applyMissionReward };
}
