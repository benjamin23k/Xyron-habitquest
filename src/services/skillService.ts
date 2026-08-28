import { supabase } from "../lib/supabaseClient";

export interface SkillRow {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    stat_key: string | null;
    cost: number;
    requires_skill_id: string | null;
    min_level: number;
}

export interface UserSkillRow {
    id: string;
    user_id: string;
    skill_id: string;
    unlocked_at: string;
}

export interface UnlockSkillResult {
    skill_key: string;
    skill_name: string;
    points_remaining: number;
}

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

export async function fetchSkills(): Promise<SkillRow[]> {
    const client = requireClient();

    const { data, error } = await client.from("skills").select("*").order("cost", { ascending: true });

    if (error) {
        throw error;
    }

    return data as SkillRow[];
}

export async function fetchUserSkills(userId: string): Promise<UserSkillRow[]> {
    const client = requireClient();

    const { data, error } = await client.from("user_skills").select("*").eq("user_id", userId);

    if (error) {
        throw error;
    }

    return data as UserSkillRow[];
}

// Server-validada (nivel mínimo, prerrequisito, costo) — ver
// supabase/migrations/0008_skill_tree.sql. El cliente nunca decide si un
// desbloqueo es legítimo, solo muestra el resultado.
export async function unlockSkill(skillId: string): Promise<UnlockSkillResult> {
    const client = requireClient();

    const { data, error } = await client.rpc("unlock_skill", { p_skill_id: skillId });

    if (error) {
        throw error;
    }

    return data as UnlockSkillResult;
}
