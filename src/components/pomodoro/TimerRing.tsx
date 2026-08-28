import type { ReactNode } from "react";

interface TimerRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    children?: ReactNode;
}

function TimerRing({ progress, size = 240, strokeWidth = 10, children }: TimerRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedProgress = Math.min(1, Math.max(0, progress));
    const offset = circumference * (1 - clampedProgress);

    return (
        <div className="timer-ring" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="presentation">
                <circle className="timer-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" />
                <circle
                    className="timer-ring-progress"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <div className="timer-ring-content">{children}</div>
        </div>
    );
}

export default TimerRing;
