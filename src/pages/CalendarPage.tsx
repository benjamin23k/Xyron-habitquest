import { useDashboardContext } from "../hooks/useDashboardContext";
import ProgressCalendar from "../components/calendar/ProgressCalendar";

function CalendarPage() {
    const { missions, userMissions } = useDashboardContext();

    return (
        <div className="page-stack">
            <h1>Calendario de progreso</h1>
            <ProgressCalendar missions={missions} userMissions={userMissions} />
        </div>
    );
}

export default CalendarPage;
