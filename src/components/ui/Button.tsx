import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "premium";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: "md" | "sm" | "icon";
    loading?: boolean;
}

function Button({
    variant = "secondary",
    size = "md",
    loading = false,
    className,
    children,
    disabled,
    ...rest
}: ButtonProps) {
    const classes = [
        "btn",
        `btn--${variant}`,
        size === "sm" && "btn--sm",
        size === "icon" && "btn--icon",
        loading && "btn--loading",
        className
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={classes} disabled={disabled || loading} {...rest}>
            {loading && <span className="btn-spinner" aria-hidden="true" />}
            {children}
        </button>
    );
}

export default Button;
