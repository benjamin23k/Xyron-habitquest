interface ProgressBarProps {
    value: number;
    max: number;
    size?: "md" | "lg";
    variant?: "primary" | "xp" | "coins";
    label?: string;
}

function ProgressBar({ value, max, size = "md", variant = "primary", label }: ProgressBarProps) {
    const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

    const fillClass =
        variant === "primary" ? "progress-bar-fill" : `progress-bar-fill progress-bar-fill--${variant}`;

    return (
        <div
            className={size === "lg" ? "progress-bar progress-bar--lg" : "progress-bar"}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label}
        >
            <div className={fillClass} style={{ width: `${percent}%` }} />
        </div>
    );
}

export default ProgressBar;
