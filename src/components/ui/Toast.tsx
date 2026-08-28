import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle, TrendUp, Trophy, Coins as CoinsIcon, Info } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export type ToastKind = "mission" | "levelup" | "achievement" | "coins" | "info";

export interface ToastInput {
    kind: ToastKind;
    title: string;
    lines?: string[];
}

interface ToastItem extends ToastInput {
    id: string;
}

interface ToastContextValue {
    push: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 3400;

const TOAST_ICONS: Record<ToastKind, Icon> = {
    mission: CheckCircle,
    levelup: TrendUp,
    achievement: Trophy,
    coins: CoinsIcon,
    info: Info
};

const TOAST_LABELS: Record<ToastKind, string> = {
    mission: "Misión completa",
    levelup: "¡Subiste de nivel!",
    achievement: "Logro desbloqueado",
    coins: "Monedas",
    info: "Aviso"
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const push = useCallback((toast: ToastInput) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { ...toast, id }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((item) => item.id !== id));
        }, TOAST_DURATION_MS);
    }, []);

    return (
        <ToastContext.Provider value={{ push }}>
            {children}
            <div className="toast-stack" aria-live="polite">
                {toasts.map((toast) => (
                    <ToastCard key={toast.id} toast={toast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast debe usarse dentro de un ToastProvider");
    }
    return context;
}

function ToastCard({ toast }: { toast: ToastItem }) {
    const ToastIcon = TOAST_ICONS[toast.kind];

    return (
        <div className={`toast toast--${toast.kind}`} role="status">
            <p className="toast-title">
                <ToastIcon size={18} weight="fill" aria-hidden="true" /> {TOAST_LABELS[toast.kind]}
            </p>
            <p className="toast-line">{toast.title}</p>
            {toast.lines?.map((line, index) => (
                <p key={index} className="toast-sub">
                    {line}
                </p>
            ))}
        </div>
    );
}
