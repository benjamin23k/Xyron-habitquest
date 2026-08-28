import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { Mission, UserMission } from "../../services/missionService";
import { getMonthMatrix } from "../../systems/calendar";
import { toDateKey } from "../../systems/date";
import { computeDailyActivity, getActivityLevel } from "../../systems/calendarStats";
import { computeStreakFromDates } from "../../systems/streak";
import Button from "../ui/Button";

interface ProgressCalendarProps {
    missions: Mission[];
    userMissions: UserMission[];
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const DAY_QUALITY: { min: number; text: string }[] = [
    { min: 3, text: "Día muy fuerte." },
    { min: 2, text: "Buen día." },
    { min: 1, text: "Día sólido." },
    { min: 0, text: "Sin actividad registrada." }
];

function getDayQuality(count: number): string {
    const tier = DAY_QUALITY.find((candidate) => count >= candidate.min);
    return tier ? tier.text : DAY_QUALITY[DAY_QUALITY.length - 1].text;
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function ProgressCalendar({ missions, userMissions }: ProgressCalendarProps) {
    const today = new Date();
    const todayKey = toDateKey(today);

    const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

    const activityByDate = computeDailyActivity(missions, userMissions);
    const weeks = getMonthMatrix(viewDate.getFullYear(), viewDate.getMonth());
    const monthLabel = capitalize(viewDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" }));

    const selectedActivity = activityByDate[selectedDateKey] ?? { count: 0, xp: 0, coins: 0 };
    const selectedLabel = capitalize(
        new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long"
        })
    );

    const monthDayKeys = weeks
        .flat()
        .filter((day): day is NonNullable<typeof day> => day !== null && day.date.getMonth() === viewDate.getMonth())
        .map((day) => day.dateKey);

    const monthTotals = monthDayKeys.reduce(
        (acc, key) => {
            const activity = activityByDate[key];
            if (activity) {
                acc.xp += activity.xp;
                acc.missions += activity.count;
            }
            return acc;
        },
        { xp: 0, missions: 0 }
    );

    const bestStreak = computeStreakFromDates(Object.keys(activityByDate)).longest;

    function goToPreviousMonth() {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }

    function goToNextMonth() {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }

    return (
        <div className="progress-calendar card animate-in">
            <div className="calendar-header">
                <Button type="button" variant="ghost" size="icon" onClick={goToPreviousMonth} aria-label="Mes anterior">
                    <CaretLeft size={16} aria-hidden="true" />
                </Button>
                <span className="calendar-month-label">{monthLabel}</span>
                <Button type="button" variant="ghost" size="icon" onClick={goToNextMonth} aria-label="Mes siguiente">
                    <CaretRight size={16} aria-hidden="true" />
                </Button>
            </div>

            <div className="calendar-table-wrapper">
                <table className="calendar-table">
                    <caption className="sr-only">Actividad de {monthLabel}</caption>
                    <thead>
                        <tr>
                            {WEEKDAY_LABELS.map((label) => (
                                <th key={label} scope="col">
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((week, weekIndex) => (
                            <tr key={weekIndex}>
                                {week.map((day, dayIndex) => {
                                    if (!day) {
                                        return (
                                            <td key={dayIndex} className="calendar-day calendar-day--empty" aria-hidden="true" />
                                        );
                                    }

                                    const activity = activityByDate[day.dateKey];
                                    const level = getActivityLevel(activity?.count ?? 0);
                                    const isSelected = day.dateKey === selectedDateKey;
                                    const isToday = day.dateKey === todayKey;

                                    const className = [
                                        "calendar-day-cell",
                                        `calendar-day-cell--level-${level}`,
                                        isSelected && "calendar-day-cell--selected",
                                        isToday && "calendar-day-cell--today"
                                    ]
                                        .filter(Boolean)
                                        .join(" ");

                                    return (
                                        <td key={dayIndex} className="calendar-day">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDateKey(day.dateKey)}
                                                aria-pressed={isSelected}
                                                aria-current={isToday ? "date" : undefined}
                                                aria-label={`${day.date.getDate()} — ${activity?.count ?? 0} misiones completadas`}
                                                className={className}
                                            >
                                                {day.date.getDate()}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="calendar-legend">
                <span>Menos actividad</span>
                <span className="calendar-legend-swatch calendar-legend-swatch--0" aria-hidden="true" />
                <span className="calendar-legend-swatch calendar-legend-swatch--1" aria-hidden="true" />
                <span className="calendar-legend-swatch calendar-legend-swatch--2" aria-hidden="true" />
                <span className="calendar-legend-swatch calendar-legend-swatch--3" aria-hidden="true" />
                <span>Más actividad</span>
            </div>

            <div className="calendar-detail">
                <h3>{selectedLabel}</h3>

                {selectedActivity.count > 0 ? (
                    <>
                        <p>
                            {selectedActivity.count} {selectedActivity.count === 1 ? "misión" : "misiones"} · +
                            {selectedActivity.xp} XP · +{selectedActivity.coins} XYR
                        </p>
                        <p className="text-muted">{getDayQuality(selectedActivity.count)}</p>
                    </>
                ) : (
                    <p className="text-muted">No hay actividad registrada este día.</p>
                )}
            </div>

            <div className="calendar-stats">
                <div>
                    <span className="eyebrow">XP del mes</span>
                    <span className="calendar-stats-value">{monthTotals.xp}</span>
                </div>
                <div>
                    <span className="eyebrow">Misiones del mes</span>
                    <span className="calendar-stats-value">{monthTotals.missions}</span>
                </div>
                <div>
                    <span className="eyebrow">Mejor racha</span>
                    <span className="calendar-stats-value">
                        {bestStreak} {bestStreak === 1 ? "día" : "días"}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ProgressCalendar;
