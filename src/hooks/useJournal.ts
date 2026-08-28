import { useEffect, useState } from "react";
import type { JournalEntry, NewJournalEntryInput } from "../services/journalService";
import { createJournalEntry, deleteJournalEntry, fetchJournalEntries } from "../services/journalService";

interface UseJournalResult {
    entries: JournalEntry[];
    loading: boolean;
    error: string | null;
    addEntry: (userId: string, input: NewJournalEntryInput) => Promise<void>;
    removeEntry: (entryId: string) => Promise<void>;
}

export function useJournal(userId: string | null): UseJournalResult {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        async function load() {
            if (!userId) {
                setEntries([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await fetchJournalEntries(userId);
                if (!ignore) {
                    setEntries(data);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "No se pudo cargar el journal.");
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

    async function addEntry(ownerId: string, input: NewJournalEntryInput) {
        const entry = await createJournalEntry(ownerId, input);
        setEntries((prev) => [entry, ...prev]);
    }

    async function removeEntry(entryId: string) {
        await deleteJournalEntry(entryId);
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    }

    return { entries, loading, error, addEntry, removeEntry };
}
