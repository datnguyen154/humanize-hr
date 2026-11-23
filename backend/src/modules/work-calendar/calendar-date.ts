import type { CalendarExceptionPayload } from "./calendar-exception.types";

const DAY_MS = 86400000;

export const civilDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
export const isoWeekday = (value: string): number => civilDate(value).getUTCDay() || 7;
export const civilDayNumber = (value: string): number => civilDate(value).getTime() / DAY_MS;

export function nextCivilDate(value: string): string | null {
    if (value >= "9999-12-31") return null;
    return new Date(civilDate(value).getTime() + DAY_MS).toISOString().slice(0, 10);
}

export function monthDates(year: number, month: number): string[] {
    const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    const result: string[] = [];
    let date: string | null = `${prefix}-01`;
    while (date?.startsWith(prefix)) {
        result.push(date);
        date = nextCivilDate(date);
    }
    return result;
}

export const timeMinutes = (value: string): number => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));

export const affectedDates = (payload: CalendarExceptionPayload): string[] =>
    payload.kind === "SWAP" ? [payload.offDate, payload.workDate].sort() : [payload.date];
