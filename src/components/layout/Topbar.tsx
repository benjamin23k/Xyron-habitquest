import { Link } from "react-router-dom";
import { List, Fire } from "@phosphor-icons/react";
import CoinBalance from "../ui/CoinBalance";
import Button from "../ui/Button";
import NotificationBell from "./NotificationBell";
import type { NotificationRow } from "../../services/notificationService";

interface TopbarProps {
    level: number;
    streakDays: number;
    coins: number;
    playerName: string;
    notifications: NotificationRow[];
    unreadCount: number;
    onMarkNotificationRead: (id: string) => void;
    onMarkAllNotificationsRead: () => void;
    onToggleSidebar: () => void;
    onLogout: () => void;
}

function Topbar({
    level,
    streakDays,
    coins,
    playerName,
    notifications,
    unreadCount,
    onMarkNotificationRead,
    onMarkAllNotificationsRead,
    onToggleSidebar,
    onLogout
}: TopbarProps) {
    const initial = playerName.trim().charAt(0).toUpperCase() || "?";

    return (
        <header className="topbar">
            <button type="button" className="topbar-menu-button" onClick={onToggleSidebar} aria-label="Abrir menú">
                <List size={22} aria-hidden="true" />
            </button>

            <Link to="/dashboard" className="topbar-logo">
                XYRON
            </Link>

            <div className="topbar-stats">
                <span className="topbar-stat" title="Racha actual">
                    <Fire size={16} weight="fill" aria-hidden="true" /> {streakDays} {streakDays === 1 ? "día" : "días"}
                </span>

                <CoinBalance coins={coins} />

                <span className="topbar-stat topbar-stat--level">LVL {level}</span>

                <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkRead={onMarkNotificationRead}
                    onMarkAllRead={onMarkAllNotificationsRead}
                />

                <Link to="/profile" className="topbar-avatar" aria-label={`Ver perfil de ${playerName}`}>
                    {initial}
                </Link>

                <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
                    Salir
                </Button>
            </div>
        </header>
    );
}

export default Topbar;
