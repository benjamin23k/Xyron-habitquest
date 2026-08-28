import { useState } from "react";
import { Bell, CheckCircle, Trophy, TrendUp, Info, Crown, Timer, Repeat } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { NotificationRow } from "../../services/notificationService";

const ICON_BY_KIND: Record<string, Icon> = {
    mission: CheckCircle,
    habit: Repeat,
    levelup: TrendUp,
    achievement: Trophy,
    title: Crown,
    focus: Timer,
    info: Info
};

function formatRelativeTime(timestamp: string, now: number = Date.now()): string {
    const diffMinutes = Math.floor((now - new Date(timestamp).getTime()) / 60_000);

    if (diffMinutes < 1) {
        return "recién";
    }
    if (diffMinutes < 60) {
        return `hace ${diffMinutes} min`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `hace ${diffHours} h`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
}

interface NotificationBellProps {
    notifications: NotificationRow[];
    unreadCount: number;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
}

function NotificationBell({ notifications, unreadCount, onMarkRead, onMarkAllRead }: NotificationBellProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="notification-bell">
            <button
                type="button"
                className="notification-bell-trigger"
                onClick={() => setOpen((prev) => !prev)}
                aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : "Notificaciones"}
                aria-expanded={open}
            >
                <Bell size={20} weight={unreadCount > 0 ? "fill" : "regular"} aria-hidden="true" />
                {unreadCount > 0 && <span className="notification-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>

            {open && (
                <>
                    <div className="notification-panel-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
                    <div className="notification-panel">
                        <div className="notification-panel-header">
                            <h3>Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button type="button" className="notification-panel-mark-all" onClick={onMarkAllRead}>
                                    Marcar todas leídas
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <p className="text-muted notification-panel-empty">Todavía no hay notificaciones.</p>
                        ) : (
                            <ul className="notification-list">
                                {notifications.map((item) => {
                                    const ItemIcon = ICON_BY_KIND[item.kind] ?? Info;
                                    return (
                                        <li
                                            key={item.id}
                                            className={item.is_read ? "notification-item" : "notification-item notification-item--unread"}
                                            onClick={() => !item.is_read && onMarkRead(item.id)}
                                        >
                                            <span className="notification-item-icon" aria-hidden="true">
                                                <ItemIcon size={16} weight="fill" />
                                            </span>
                                            <div className="notification-item-body">
                                                <span className="notification-item-title">{item.title}</span>
                                                {item.body && <span className="notification-item-detail">{item.body}</span>}
                                            </div>
                                            <span className="notification-item-time">{formatRelativeTime(item.created_at)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default NotificationBell;
