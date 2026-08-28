import type { Icon } from "@phosphor-icons/react";
import { House, Sword, ChartBar, CalendarBlank, Trophy, UserCircle, Gear } from "@phosphor-icons/react";

export interface NavItem {
    to: string;
    label: string;
    icon: Icon;
}

export const NAV_ITEMS: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: House },
    { to: "/missions", label: "Misiones", icon: Sword },
    { to: "/attributes", label: "Atributos", icon: ChartBar },
    { to: "/calendar", label: "Calendario", icon: CalendarBlank },
    { to: "/achievements", label: "Logros", icon: Trophy }
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
    { to: "/profile", label: "Perfil", icon: UserCircle },
    { to: "/settings", label: "Ajustes", icon: Gear }
];
