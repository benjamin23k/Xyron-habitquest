import type { ReactNode } from "react";

export type BadgeVariant = "default" | "primary" | "success" | "easy" | "medium" | "hard" | "epic";

interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
}

function Badge({ variant = "default", children }: BadgeProps) {
    const className = variant === "default" ? "badge" : `badge badge--${variant}`;
    return <span className={className}>{children}</span>;
}

export default Badge;
