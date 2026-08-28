interface SkeletonProps {
    width?: string;
    height?: string;
    circle?: boolean;
    className?: string;
}

function Skeleton({ width = "100%", height = "16px", circle = false, className }: SkeletonProps) {
    const classes = ["skeleton", className].filter(Boolean).join(" ");

    return (
        <div
            className={classes}
            style={{ width, height, borderRadius: circle ? "50%" : undefined }}
            aria-hidden="true"
        />
    );
}

export default Skeleton;
