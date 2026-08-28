import { toDateKey } from "./date";

export interface CalendarDay {
    date: Date;
    dateKey: string;
}

// Semanas de lunes a domingo, con celdas nulas para rellenar antes/después del mes.
export function getMonthMatrix(year: number, month: number): (CalendarDay | null)[][] {
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;

    const cells: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstWeekday; i++) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        cells.push({ date, dateKey: toDateKey(date) });
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const weeks: (CalendarDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }

    return weeks;
}
