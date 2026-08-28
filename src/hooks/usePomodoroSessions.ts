import { useEffect, useState } from "react";
import type { PomodoroSession } from "../services/pomodoroService";
import { fetchPomodoroSessions } from "../services/pomodoroService";

interface UsePomodoroSessionsResult {
    sessions: PomodoroSession[];
    loading: boolean;
    error: string | null;
    addSession: (session: PomodoroSession) => void;
}

export function usePomodoroSessions(userId: string | null): UsePomodoroSessionsResult {
    const [sessions, setSessions] = useState<PomodoroSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        async function load() {
            if (!userId) {
                setSessions([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await fetchPomodoroSessions(userId);
                if (!ignore) {
                    setSessions(data);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "No se pudo cargar el historial de foco.");
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

    // El llamador arma el registro con lo que ya sabe (arranque + resultado
    // del RPC) para no pedir de nuevo todo el historial por cada sesión.
    function addSession(session: PomodoroSession) {
        setSessions((prev) => [session, ...prev]);
    }

    return { sessions, loading, error, addSession };
}
