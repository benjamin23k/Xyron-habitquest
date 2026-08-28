import { supabase } from "../lib/supabaseClient";

export type Mood = "great" | "good" | "okay" | "bad" | "terrible";

export interface JournalEntry {
    id: string;
    user_id: string;
    mood: Mood | null;
    reflection: string | null;
    wins: string | null;
    problems: string | null;
    goals: string | null;
    entry_date: string;
    created_at: string;
}

export interface NewJournalEntryInput {
    mood: Mood | null;
    reflection: string;
    wins: string;
    problems: string;
    goals: string;
    entryDate: string;
}

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

export async function fetchJournalEntries(userId: string): Promise<JournalEntry[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data as JournalEntry[];
}

export async function createJournalEntry(userId: string, input: NewJournalEntryInput): Promise<JournalEntry> {
    const client = requireClient();

    const { data, error } = await client
        .from("journal_entries")
        .insert({
            user_id: userId,
            mood: input.mood,
            reflection: input.reflection.trim() || null,
            wins: input.wins.trim() || null,
            problems: input.problems.trim() || null,
            goals: input.goals.trim() || null,
            entry_date: input.entryDate
        })
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    return data as JournalEntry;
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
    const client = requireClient();

    const { error } = await client.from("journal_entries").delete().eq("id", entryId);

    if (error) {
        throw error;
    }
}
