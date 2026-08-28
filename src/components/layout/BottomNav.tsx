import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";

function linkClass({ isActive }: { isActive: boolean }): string {
    return isActive ? "bottom-nav-link bottom-nav-link--active" : "bottom-nav-link";
}

function BottomNav() {
    return (
        <nav className="bottom-nav" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
                const ItemIcon = item.icon;
                return (
                    <NavLink key={item.to} to={item.to} className={linkClass}>
                        {({ isActive }) => (
                            <>
                                <ItemIcon size={20} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
                                <span className="bottom-nav-label">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
}

export default BottomNav;
