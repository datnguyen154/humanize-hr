import { isoWeekday } from "../work-calendar/calendar-date";
import type { CalendarPreviewDay } from "../work-calendar/calendar-exception.types";

export { monthDates } from "../work-calendar/calendar-date";

export type TimesheetDayStatus =
    | "PRESENT" | "LATE" | "PAID_LEAVE" | "UNPAID_LEAVE" | "ABSENT" | "UPCOMING"
    | "DAY_OFF" | "OUT_OF_SCHEDULE" | "NO_SCHEDULE" | "NOT_EMPLOYED";

export type TimesheetLeaveType = "ANNUAL" | "SICK" | "UNPAID" | "OTHER";
// Demo convention (roadmap decision 23/11/2026), not legal advice.
export const PAID_LEAVE_TYPES: ReadonlySet<TimesheetLeaveType> = new Set(["ANNUAL", "OTHER"]);

export type TimesheetAttendance = {
    status: "PRESENT" | "LATE";
    outOfSchedule: boolean;
    checkInTime: string;
    checkOutTime: string | null;
};
export type TimesheetLeave = { leaveType: TimesheetLeaveType; from: string; to: string };

export type TimesheetDay = {
    date: string;
    weekday: number;
    dayType: CalendarPreviewDay["dayType"];
    status: TimesheetDayStatus;
    isPayable: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    missingCheckOut: boolean;
    leaveType: TimesheetLeaveType | null;
};

export type TimesheetSummary = {
    requiredDays: number;
    presentDays: number;
    lateDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    absentDays: number;
    upcomingDays: number;
    outOfScheduleDays: number;
    missingCheckOutDays: number;
    noScheduleDays: number;
    payableDays: number;
};

/** Standard days of the month = working days of the ACTIVE calendar; null while any day lacks a calendar. */
export function standardDays(dates: string[], resolveDay: (date: string) => CalendarPreviewDay | null): number | null {
    let total = 0;
    for (const date of dates) {
        const day = resolveDay(date);
        if (!day || day.dayType === "UNRESOLVED" || day.dayType === "NO_SCHEDULE") return null;
        if (day.isWorkingDay) total += 1;
    }
    return total;
}

/**
 * One employee's month. Payable = present/late + paid leave on working days. Punches on days without a
 * shift are kept as OUT_OF_SCHEDULE for HR review and never become payable or overtime.
 */
export function buildEmployeeTimesheet(input: {
    dates: string[];
    today: string;
    joinedAt: string;
    resolveDay: (date: string) => CalendarPreviewDay | null;
    attendance: Map<string, TimesheetAttendance>;
    leaves: TimesheetLeave[];
}): { days: TimesheetDay[]; summary: TimesheetSummary } {
    const summary: TimesheetSummary = { requiredDays: 0, presentDays: 0, lateDays: 0, paidLeaveDays: 0, unpaidLeaveDays: 0,
        absentDays: 0, upcomingDays: 0, outOfScheduleDays: 0, missingCheckOutDays: 0, noScheduleDays: 0, payableDays: 0 };
    const days = input.dates.map((date): TimesheetDay => {
        const calendar = input.resolveDay(date);
        const punch = input.attendance.get(date);
        const leave = input.leaves.find((l) => l.from <= date && date <= l.to);
        const base = { date, weekday: isoWeekday(date), dayType: calendar?.dayType ?? "NO_SCHEDULE" as const,
            checkInTime: punch?.checkInTime ?? null, checkOutTime: punch?.checkOutTime ?? null,
            missingCheckOut: Boolean(punch && !punch.checkOutTime && date < input.today), leaveType: null, isPayable: false };
        if (date < input.joinedAt) return { ...base, status: "NOT_EMPLOYED" };
        if (base.missingCheckOut) summary.missingCheckOutDays += 1;
        if (!calendar || calendar.dayType === "NO_SCHEDULE") {
            summary.noScheduleDays += 1;
            return { ...base, status: "NO_SCHEDULE" };
        }
        if (!calendar.isWorkingDay) {
            if (punch) {
                summary.outOfScheduleDays += 1;
                return { ...base, status: "OUT_OF_SCHEDULE" };
            }
            return { ...base, status: "DAY_OFF" };
        }
        summary.requiredDays += 1;
        if (punch) {
            summary.presentDays += 1;
            if (punch.status === "LATE") summary.lateDays += 1;
            return { ...base, status: punch.status, isPayable: true };
        }
        if (leave) {
            const paid = PAID_LEAVE_TYPES.has(leave.leaveType);
            if (paid) summary.paidLeaveDays += 1;
            else summary.unpaidLeaveDays += 1;
            return { ...base, status: paid ? "PAID_LEAVE" : "UNPAID_LEAVE", leaveType: leave.leaveType, isPayable: paid };
        }
        if (date >= input.today) {
            summary.upcomingDays += 1;
            return { ...base, status: "UPCOMING" };
        }
        summary.absentDays += 1;
        return { ...base, status: "ABSENT" };
    });
    summary.payableDays = summary.presentDays + summary.paidLeaveDays;
    return { days, summary };
}
