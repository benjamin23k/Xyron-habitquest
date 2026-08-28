import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";

interface EmptyStateProps {
    icon: Icon;
    title: string;
    description: string;
    action?: ReactNode;
}

function EmptyState({ icon: StateIcon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
                <StateIcon size={32} />
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
            {action}
        </div>
    );
}

export default EmptyState;
