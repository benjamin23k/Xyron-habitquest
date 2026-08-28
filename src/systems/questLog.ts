export interface QuestLogEntry {
    questId: string;
    dateKey: string;
    completedAt: number;
}

export function groupLogByDate(log: QuestLogEntry[]): Record<string, QuestLogEntry[]> {
    const grouped: Record<string, QuestLogEntry[]> = {};

    for (const entry of log) {
        const existing = grouped[entry.dateKey];

        if (existing) {
            existing.push(entry);
        } else {
            grouped[entry.dateKey] = [entry];
        }
    }

    return grouped;
}
