import { supabase } from "../lib/supabaseClient";

export interface NotificationRow {
    id: string;
    user_id: string;
    kind: string;
    title: string;
    body: string | null;
    is_read: boolean;
    created_at: string;
}

export interface NewNotificationInput {
    kind: string;
    title: string;
    body: string | null;
}

const NOTIFICATIONS_LIMIT = 50;

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
    const client = requireClient();

    const { data, error } = await client
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(NOTIFICATIONS_LIMIT);

    if (error) {
        throw error;
    }

    return data as NotificationRow[];
}

// Registro de algo que YA pasó y ya fue validado por su propio RPC (misión,
// pomodoro, achievement, título) — esta tabla es solo un espejo persistente
// del toast, no otorga nada por sí misma, así que un insert directo del
// cliente es seguro (ver supabase/migrations/0010_journal_and_notifications.sql).
export async function createNotification(userId: string, input: NewNotificationInput): Promise<void> {
    const client = requireClient();

    const { error } = await client.from("notifications").insert({
        user_id: userId,
        kind: input.kind,
        title: input.title,
        body: input.body
    });

    if (error) {
        throw error;
    }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    const client = requireClient();

    const { error } = await client.from("notifications").update({ is_read: true }).eq("id", notificationId);

    if (error) {
        throw error;
    }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    const client = requireClient();

    const { error } = await client
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

    if (error) {
        throw error;
    }
}
