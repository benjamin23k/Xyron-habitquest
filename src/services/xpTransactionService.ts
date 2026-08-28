import { supabase } from "../lib/supabaseClient";

export interface XpTransaction {
    id: string;
    user_id: string;
    amount: number;
    reason: string;
    source_type: string;
    source_id: string | null;
    created_at: string;
}

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

// Lee el ledger de XP (ver supabase/migrations/0004_progression_foundation.sql)
// — es la fuente más completa para analíticas, porque incluye el XP que dan
// los achievements además de misiones y pomodoro.
export async function fetchXpTransactions(userId: string): Promise<XpTransaction[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("xp_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data as XpTransaction[];
}
