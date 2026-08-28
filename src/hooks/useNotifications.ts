import { useEffect, useState } from "react";
import type { NewNotificationInput, NotificationRow } from "../services/notificationService";
import {
    createNotification,
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead
} from "../services/notificationService";

interface UseNotificationsResult {
    notifications: NotificationRow[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    notify: (input: NewNotificationInput) => void;
    markRead: (notificationId: string) => void;
    markAllRead: () => void;
}

export function useNotifications(userId: string | null): UseNotificationsResult {
    const [notifications, setNotifications] = useState<NotificationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        async function load() {
            if (!userId) {
                setNotifications([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await fetchNotifications(userId);
                if (!ignore) {
                    setNotifications(data);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones.");
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

    // Fire-and-forget a propósito: es un espejo de un toast que ya se
    // disparó, así que un fallo de red acá no debe interrumpir ni mostrar
    // error — en el peor caso, esa notificación puntual no queda guardada.
    function notify(input: NewNotificationInput) {
        if (!userId) {
            return;
        }

        const optimistic: NotificationRow = {
            id: crypto.randomUUID(),
            user_id: userId,
            kind: input.kind,
            title: input.title,
            body: input.body,
            is_read: false,
            created_at: new Date().toISOString()
        };

        setNotifications((prev) => [optimistic, ...prev]);

        createNotification(userId, input).catch(() => {
            // Silencioso — ver comentario arriba.
        });
    }

    function markRead(notificationId: string) {
        setNotifications((prev) =>
            prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item))
        );
        markNotificationRead(notificationId).catch(() => {
            // Silencioso: no bloquea la UI por un fallo de red al marcar como leída.
        });
    }

    function markAllRead() {
        setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
        if (userId) {
            markAllNotificationsRead(userId).catch(() => {
                // Silencioso.
            });
        }
    }

    const unreadCount = notifications.filter((item) => !item.is_read).length;

    return { notifications, unreadCount, loading, error, notify, markRead, markAllRead };
}
