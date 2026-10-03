import type { AttendanceStatus } from "@prisma/client";

import { getCompanyDateContext } from "../attendance/attendance.service";
import { adminDashboardRepository } from "./admin-dashboard.repository";
import { DashboardServiceError } from "./dashboard.service";

const SUPPORTED_PERIODS = [7, 30] as const;
const DEFAULT_PERIOD_DAYS = SUPPORTED_PERIODS[0];
const RECENT_ACTIVITY_LIMIT = 10;

type AttendanceGroup = {
    attendanceDate: Date;
    status: AttendanceStatus;
    _count: { _all: number };
};

type AttendanceTrendPoint = {
    date: string;
    total: number;
    present: number;
    late: number;
};

type AdminActivity = {
    id: string;
    type: "attendance" | "leave-request" | "department";
    subject: string;
    createdAt: Date;
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const getAdminDashboardPeriod = (input: unknown, now: Date) => {
    const days = input === undefined ? DEFAULT_PERIOD_DAYS : Number(input);
    if (
        (input !== undefined && typeof input !== "string") ||
        !SUPPORTED_PERIODS.some((period) => period === days)
    ) {
        throw new DashboardServiceError("days must be 7 or 30", 400);
    }

    const { attendanceDate: today } = getCompanyDateContext(now);
    const fromDate = new Date(today);
    fromDate.setUTCDate(fromDate.getUTCDate() - days + 1);
    return { days, today, fromDate };
};

export const buildAdminAttendanceTrend = (
    groups: AttendanceGroup[], fromDate: Date, days: number,
): AttendanceTrendPoint[] => {
    const byDate = new Map<string, AttendanceTrendPoint>();
    for (let offset = 0; offset < days; offset += 1) {
        const date = new Date(fromDate);
        date.setUTCDate(date.getUTCDate() + offset);
        const key = toDateKey(date);
        byDate.set(key, { date: key, total: 0, present: 0, late: 0 });
    }

    for (const group of groups) {
        const point = byDate.get(toDateKey(group.attendanceDate));
        if (!point) continue;
        const count = group._count._all;
        point.total += count;
        if (group.status === "PRESENT") point.present += count;
        if (group.status === "LATE") point.late += count;
    }
    return [...byDate.values()];
};

export const adminDashboardService = {
    async getDashboard(periodInput: unknown, now = new Date()) {
        const { days, today, fromDate } = getAdminDashboardPeriod(periodInput, now);
        const [totalEmployees, totalDepartments, totalLeaveRequests, groups,
            attendances, leaveRequests, departments] =
            await adminDashboardRepository.getSnapshot(fromDate, today, RECENT_ACTIVITY_LIMIT);

        const attendanceTrend = buildAdminAttendanceTrend(groups, fromDate, days);
        // Each source's newest N contains every candidate for the combined newest N.
        const activities: AdminActivity[] = [
            ...attendances.map((item) => ({
                id: `attendance-${item.id}`, type: "attendance" as const,
                subject: item.employee.fullName, createdAt: item.createdAt,
            })),
            ...leaveRequests.map((item) => ({
                id: `leave-request-${item.id}`, type: "leave-request" as const,
                subject: item.employee.fullName, createdAt: item.createdAt,
            })),
            ...departments.map((item) => ({
                id: `department-${item.id}`, type: "department" as const,
                subject: item.name, createdAt: item.createdAt,
            })),
        ];

        return {
            generatedAt: now.toISOString(),
            period: { days, fromDate: toDateKey(fromDate), toDate: toDateKey(today) },
            summary: {
                totalEmployees, totalDepartments, totalLeaveRequests,
                todayAttendance: attendanceTrend[attendanceTrend.length - 1].total,
            },
            attendanceTrend,
            recentActivities: activities
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
                .slice(0, RECENT_ACTIVITY_LIMIT),
        };
    },
};
