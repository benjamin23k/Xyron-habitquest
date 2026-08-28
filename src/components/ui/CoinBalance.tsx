import { useEffect, useRef, useState } from "react";
import { Coins } from "@phosphor-icons/react";

interface CoinBalanceProps {
    coins: number;
    size?: "sm" | "lg";
}

function CoinBalance({ coins, size = "sm" }: CoinBalanceProps) {
    const previous = useRef(coins);
    const [delta, setDelta] = useState<number | null>(null);

    useEffect(() => {
        const diff = coins - previous.current;
        previous.current = coins;

        if (diff === 0) {
            return;
        }

        setDelta(diff);
        const timer = setTimeout(() => setDelta(null), 1200);
        return () => clearTimeout(timer);
    }, [coins]);

    const className = ["coin-balance", size === "lg" && "coin-balance--lg", delta !== null && "coin-balance--pulse"]
        .filter(Boolean)
        .join(" ");

    return (
        <span className={className}>
            <Coins size={size === "lg" ? 22 : 16} weight="fill" aria-hidden="true" />
            <span>{coins.toLocaleString("es-AR")}</span>
            {delta !== null && (
                <span className="coin-balance-delta" aria-hidden="true">
                    {delta > 0 ? `+${delta}` : delta}
                </span>
            )}
        </span>
    );
}

export default CoinBalance;
