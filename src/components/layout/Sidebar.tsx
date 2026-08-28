import { NavLink } from "react-router-dom";
import { Sparkle } from "@phosphor-icons/react";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "./navItems";
import type { NavItem } from "./navItems";

interface SidebarProps {
    open: boolean;
    onNavigate: () => void;
}

function linkClass({ isActive }: { isActive: boolean }): string {
    return isActive ? "sidebar-link sidebar-link--active" : "sidebar-link";
}

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
    const ItemIcon = item.icon;

    return (
        <NavLink to={item.to} onClick={onNavigate} className={linkClass}>
            {({ isActive }) => (
                <>
                    <ItemIcon size={20} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
                    {item.label}
                </>
            )}
        </NavLink>
    );
}

function Sidebar({ open, onNavigate }: SidebarProps) {
    return (
        <>
            {open && <div className="sidebar-backdrop" onClick={onNavigate} aria-hidden="true" />}

            <nav className={open ? "sidebar sidebar--open" : "sidebar"} aria-label="Navegación principal">
                <div className="sidebar-logo">
                    <Sparkle size={20} weight="fill" aria-hidden="true" /> XYRON
                </div>

                <ul className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <li key={item.to}>
                            <NavItemLink item={item} onNavigate={onNavigate} />
                        </li>
                    ))}
                </ul>

                <ul className="sidebar-nav sidebar-nav--secondary">
                    {SECONDARY_NAV_ITEMS.map((item) => (
                        <li key={item.to}>
                            <NavItemLink item={item} onNavigate={onNavigate} />
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}

export default Sidebar;
