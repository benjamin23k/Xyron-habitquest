import { CheckCircle, Trophy, Crown, TreeStructure, Timer, Repeat } from "@phosphor-icons/react";
import type { ActivityEvent, ActivityEventType } from "../../systems/activityFeed";

const ICON_BY_TYPE: Record<ActivityEventType, typeof CheckCircle> = {
    mission: CheckCircle,
    habit: Repeat,
    achievement: Trophy,
    title: Crown,
    skill: TreeStructure,
    focus: Timer
};

function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / 60_000);

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

interface ActivityFeedListProps {
    events: ActivityEvent[];
}

function ActivityFeedList({ events }: ActivityFeedListProps) {
    if (events.length === 0) {
        return <p className="text-muted">Todavía no hay actividad registrada.</p>;
    }

    return (
        <ul className="activity-feed">
            {events.map((event) => {
                const EventIcon = ICON_BY_TYPE[event.type];
                return (
                    <li key={event.id} className="activity-feed-item">
                        <span className={`activity-feed-icon activity-feed-icon--${event.type}`} aria-hidden="true">
                            <EventIcon size={16} weight="fill" />
                        </span>
                        <span className="activity-feed-label">{event.label}</span>
                        {event.detail && <span className="activity-feed-detail">{event.detail}</span>}
                        <span className="activity-feed-time">{formatRelativeTime(event.timestamp)}</span>
                    </li>
                );
            })}
        </ul>
    );
}

export default ActivityFeedList;
