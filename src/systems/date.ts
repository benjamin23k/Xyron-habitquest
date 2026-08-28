export function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function daysBetween(fromKey: string, toKey: string): number {
    const from = new Date(`${fromKey}T00:00:00`);
    const to = new Date(`${toKey}T00:00:00`);

    return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

// Lunes de la semana calendario (local) de `date`, a medianoche — mismo
// criterio que systems/calendar.ts (semana arranca en lunes).
export function startOfWeek(date: Date): number {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = result.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + diffToMonday);
    return result.getTime();
}
