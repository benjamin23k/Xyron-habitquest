import type { Icon } from "@phosphor-icons/react";
import {
    House,
    Sword,
    Repeat,
    ChartBar,
    CalendarBlank,
    Trophy,
    TreeStructure,
    Timer,
    ChartLineUp,
    NotePencil,
    UserCircle,
    Gear
} from "@phosphor-icons/react";

export interface NavItem {
    to: string;
    label: string;
    icon: Icon;
}

export const NAV_ITEMS: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: House },
    { to: "/missions", label: "Misiones", icon: Sword },
    { to: "/habits", label: "Hábitos", icon: Repeat },
    { to: "/focus", label: "Focus", icon: Timer },
    { to: "/attributes", label: "Atributos", icon: ChartBar },
    { to: "/skills", label: "Skills", icon: TreeStructure },
    { to: "/calendar", label: "Calendario", icon: CalendarBlank },
    { to: "/achievements", label: "Logros", icon: Trophy }
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
    { to: "/analytics", label: "Analytics", icon: ChartLineUp },
    { to: "/journal", label: "Journal", icon: NotePencil },
    { to: "/profile", label: "Perfil", icon: UserCircle },
    { to: "/settings", label: "Ajustes", icon: Gear }
];
