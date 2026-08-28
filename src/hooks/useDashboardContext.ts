import { useOutletContext } from "react-router-dom";
import type { DashboardContextValue } from "../components/layout/DashboardContext";

export function useDashboardContext(): DashboardContextValue {
    return useOutletContext<DashboardContextValue>();
}
