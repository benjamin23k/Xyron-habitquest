import { useEffect, useState } from "react";
import type { XpTransaction } from "../services/xpTransactionService";
import { fetchXpTransactions } from "../services/xpTransactionService";

interface UseXpTransactionsResult {
    xpTransactions: XpTransaction[];
    loading: boolean;
    error: string | null;
}

// Solo lectura: a diferencia de otros hooks de datos, Analytics no necesita
// una actualización optimista al instante (no es feedback de una acción del
// usuario) — el próximo mount ya trae el ledger al día.
export function useXpTransactions(userId: string | null): UseXpTransactionsResult {
    const [xpTransactions, setXpTransactions] = useState<XpTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        async function load() {
            if (!userId) {
                setXpTransactions([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await fetchXpTransactions(userId);
                if (!ignore) {
                    setXpTransactions(data);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "No se pudo cargar el historial de XP.");
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

    return { xpTransactions, loading, error };
}
