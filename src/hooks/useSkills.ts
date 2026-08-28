import { useEffect, useState } from "react";
import type { SkillRow, UserSkillRow } from "../services/skillService";
import { fetchSkills, fetchUserSkills, unlockSkill } from "../services/skillService";

interface UseSkillsResult {
    skills: SkillRow[];
    userSkills: UserSkillRow[];
    unlockedSkillIds: Set<string>;
    loading: boolean;
    error: string | null;
    unlock: (skillId: string) => Promise<void>;
}

export function useSkills(userId: string | null): UseSkillsResult {
    const [skills, setSkills] = useState<SkillRow[]>([]);
    const [userSkills, setUserSkills] = useState<UserSkillRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Mismo patrón de cancelación que el resto de los hooks de datos.
        let ignore = false;

        async function load() {
            if (!userId) {
                setSkills([]);
                setUserSkills([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [skillsData, userSkillsData] = await Promise.all([fetchSkills(), fetchUserSkills(userId)]);

                if (!ignore) {
                    setSkills(skillsData);
                    setUserSkills(userSkillsData);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "No se pudieron cargar las skills.");
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

    async function unlock(skillId: string) {
        await unlockSkill(skillId);

        setUserSkills((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                user_id: userId ?? "",
                skill_id: skillId,
                unlocked_at: new Date().toISOString()
            }
        ]);
    }

    const unlockedSkillIds = new Set(userSkills.map((entry) => entry.skill_id));

    return { skills, userSkills, unlockedSkillIds, loading, error, unlock };
}
