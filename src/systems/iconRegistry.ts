import type { Icon } from "@phosphor-icons/react";
import {
    Barbell,
    Brain,
    ListChecks,
    PaintBrush,
    Target,
    ChatCircleDots,
    BookOpen,
    Code,
    MusicNotes,
    Calculator,
    Coins,
    Leaf,
    Star,
    MagnifyingGlass,
    GameController,
    PenNib,
    Heartbeat,
    Medal,
    Trophy,
    Fire,
    Lightning,
    Compass,
    Crown,
    Sparkle
} from "@phosphor-icons/react";

// Registro central de iconos: mapea claves de string (persistidas en Supabase
// para atributos, o en data estática para logros) a componentes de Phosphor.
// Las claves nuevas se generan desde aquí; las claves viejas (emoji legado en
// `stats.icon`) simplemente no matchean y el llamador debe hacer fallback a
// texto plano — ver `resolveIcon`.
export const ICON_REGISTRY: Record<string, Icon> = {
    Barbell,
    Brain,
    ListChecks,
    PaintBrush,
    Target,
    ChatCircleDots,
    BookOpen,
    Code,
    MusicNotes,
    Calculator,
    Coins,
    Leaf,
    Star,
    MagnifyingGlass,
    GameController,
    PenNib,
    Heartbeat,
    Medal,
    Trophy,
    Fire,
    Lightning,
    Compass,
    Crown,
    Sparkle
};

export function resolveIcon(key: string): Icon | undefined {
    return ICON_REGISTRY[key];
}
