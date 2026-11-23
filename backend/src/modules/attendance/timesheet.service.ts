import { LeaveRequestStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createCalendarResolver, loadActiveCalendars } from "../work-calendar/effective-calendar";
import { parseAttendanceReportPeriod } from "./attendance-report.service";
import { AttendanceServiceError, getCompanyDateContext } from "./attendance.service";
import { buildEmployeeTimesheet, monthDates, standardDays, type TimesheetAttendance, type TimesheetLeave } from "./timesheet.engine";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const civil = (date: Date) => date.toISOString().slice(0, 10);
// Leave timestamps may be stored at UTC midnight or local midnight; the company civil date covers both.
const companyCivil = (date: Date) => civil(getCompanyDateContext(date).attendanceDate);
const employeeSelect = { id: true, employeeCode: true, fullName: true, joinedAt: true, status: true,
    department: { select: { name: true } } } as const;
type EmployeeRow = { id: string; employeeCode: string; fullName: string; joinedAt: Date; status: string; department: { name: string } | null };

/** Reads everything one month needs in a single snapshot; computation stays in the pure engine. */
async function loadMonth(year: number, month: number, employeeIds?: string[]) {
    const dates = monthDates(year, month);
    const from = new Date(`${dates[0]}T00:00:00.000Z`);
    const to = new Date(`${dates[dates.length - 1]}T00:00:00.000Z`);
    const scope = employeeIds ? { employeeId: { in: employeeIds } } : {};
    const [calendars, attendance, leaves] = await Promise.all([
        loadActiveCalendars(),
        prisma.attendance.findMany({ where: { ...scope, attendanceDate: { gte: from, lte: to } },
            select: { employeeId: true, attendanceDate: true, status: true, outOfSchedule: true, checkInTime: true, checkOutTime: true } }),
        // One-day margin on both sides so timezone-shifted leave timestamps are not missed.
        prisma.leaveRequest.findMany({ where: { ...scope, status: LeaveRequestStatus.APPROVED,
            startDate: { lte: new Date(to.getTime() + 86400000) }, endDate: { gte: new Date(from.getTime() - 86400000) } },
            select: { employeeId: true, leaveType: true, startDate: true, endDate: true } }),
    ]);
    const resolveDay = createCalendarResolver(calendars);
    const punches = new Map<string, Map<string, TimesheetAttendance>>();
    for (const row of attendance) {
        const byDate = punches.get(row.employeeId) ?? new Map();
        byDate.set(civil(row.attendanceDate), { status: row.status, outOfSchedule: row.outOfSchedule,
            checkInTime: row.checkInTime.toISOString(), checkOutTime: row.checkOutTime?.toISOString() ?? null });
        punches.set(row.employeeId, byDate);
    }
    const leaveMap = new Map<string, TimesheetLeave[]>();
    for (const row of leaves) {
        const list = leaveMap.get(row.employeeId) ?? [];
        list.push({ leaveType: row.leaveType, from: companyCivil(row.startDate), to: companyCivil(row.endDate) });
        leaveMap.set(row.employeeId, list);
    }
    const today = civil(getCompanyDateContext(new Date()).attendanceDate);
    const build = (employee: EmployeeRow) => buildEmployeeTimesheet({ dates, today, joinedAt: companyCivil(employee.joinedAt), resolveDay,
        attendance: punches.get(employee.id) ?? new Map(), leaves: leaveMap.get(employee.id) ?? [] });
    return { dates, standardDays: standardDays(dates, resolveDay), build, hasPunches: (id: string) => punches.has(id) };
}

const toEmployee = (e: EmployeeRow) => ({ id: e.id, employeeCode: e.employeeCode, fullName: e.fullName,
    departmentName: e.department?.name ?? null, status: e.status, joinedAt: companyCivil(e.joinedAt) });

export const timesheetService = {
    async getCompanyTimesheet(query: { year?: unknown; month?: unknown }) {
        const period = parseAttendanceReportPeriod(query.year, query.month);
        const lastDay = monthDates(period.year, period.month).pop()!;
        const employees = await prisma.employee.findMany({ where: { joinedAt: { lt: new Date(`${lastDay}T23:59:59.999Z`) } },
            select: employeeSelect, orderBy: { employeeCode: "asc" } });
        const month = await loadMonth(period.year, period.month);
        // Inactive employees stay listed only when they still have punches in the period.
        const rows = employees.filter((e) => e.status === "ACTIVE" || month.hasPunches(e.id))
            .map((e) => ({ employee: toEmployee(e), summary: month.build(e).summary }));
        return { period, standardDays: month.standardDays, isCalendarComplete: month.standardDays !== null, employees: rows };
    },

    async getEmployeeTimesheet(employeeId: string, query: { year?: unknown; month?: unknown }) {
        const period = parseAttendanceReportPeriod(query.year, query.month);
        if (!UUID_REGEX.test(employeeId)) throw new AttendanceServiceError("Employee not found", 404);
        const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: employeeSelect });
        if (!employee) throw new AttendanceServiceError("Employee not found", 404);
        const month = await loadMonth(period.year, period.month, [employee.id]);
        const { days, summary } = month.build(employee);
        return { period, standardDays: month.standardDays, isCalendarComplete: month.standardDays !== null,
            employee: toEmployee(employee), summary, days };
    },

    async getMyTimesheet(userId: string | undefined, query: { year?: unknown; month?: unknown }) {
        const employee = userId && UUID_REGEX.test(userId)
            ? await prisma.employee.findUnique({ where: { userId }, select: { id: true } }) : null;
        if (!employee) throw new AttendanceServiceError("Employee profile not found", 404);
        return timesheetService.getEmployeeTimesheet(employee.id, query);
    },
};
