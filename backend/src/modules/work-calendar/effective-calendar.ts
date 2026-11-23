import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { toCalendarExceptionDto } from "./calendar-exception.service";
import type { CalendarExceptionDto, CalendarPreviewDay } from "./calendar-exception.types";
import { buildCalendarPreview } from "./calendar-preview.engine";
import { toWorkScheduleDto } from "./work-schedule.service";
import type { WorkScheduleDto } from "./work-schedule.types";

export type ActiveCalendar = { schedule: WorkScheduleDto; events: CalendarExceptionDto[] };

/** All ACTIVE versions with their exceptions, newest effectiveFrom first. Data stays small (one company calendar). */
export async function loadActiveCalendars(db: Prisma.TransactionClient = prisma): Promise<ActiveCalendar[]> {
    const rows = await db.workScheduleVersion.findMany({
        where: { status: "ACTIVE" }, orderBy: { effectiveFrom: "desc" },
        include: { exceptions: { orderBy: [{ firstAffectedDate: "asc" }, { id: "asc" }] } },
    });
    return rows.map(({ exceptions, ...row }) => ({ schedule: toWorkScheduleDto(row), events: exceptions.map(toCalendarExceptionDto) }));
}

/**
 * Resolves civil dates (YYYY-MM-DD) against the ACTIVE calendars. The version with the latest
 * effectiveFrom <= date wins; null means no ACTIVE calendar covers the date (legacy behaviour).
 */
export function createCalendarResolver(calendars: ActiveCalendar[]) {
    const sorted = [...calendars].sort((a, b) => b.schedule.effectiveFrom.localeCompare(a.schedule.effectiveFrom));
    const months = new Map<string, Map<string, CalendarPreviewDay>>();
    return (date: string): CalendarPreviewDay | null => {
        const calendar = sorted.find((c) => c.schedule.effectiveFrom <= date);
        if (!calendar) return null;
        const year = Number(date.slice(0, 4));
        const month = Number(date.slice(5, 7));
        const key = `${calendar.schedule.id}:${year}-${month}`;
        let days = months.get(key);
        if (!days) {
            days = new Map(buildCalendarPreview(calendar.schedule, calendar.events, year, month).days.map((d) => [d.date, d]));
            months.set(key, days);
        }
        return days.get(date) ?? null;
    };
}

/**
 * Check-in classification. Without an ACTIVE calendar the legacy 08:00 cutoff applies. Days without
 * a shift (weekly off, holiday, compensatory off, unresolved) keep the raw check-in, flagged
 * outOfSchedule, and are never marked LATE.
 */
export function classifyCheckIn(day: CalendarPreviewDay | null, secondsSinceMidnight: number, legacyCutoffSeconds: number) {
    if (!day) return { late: secondsSinceMidnight > legacyCutoffSeconds, outOfSchedule: false };
    if (!day.isWorkingDay || !day.shift) return { late: false, outOfSchedule: true };
    const [h, m] = day.shift.startTime.split(":").map(Number);
    return { late: secondsSinceMidnight > (h * 60 + m) * 60, outOfSchedule: false };
}
