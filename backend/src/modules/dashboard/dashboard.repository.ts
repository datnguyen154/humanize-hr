import {
    AttendanceStatus,
    LeaveRequestStatus,
    LeaveType,
    type Prisma,
} from "@prisma/client";

import { prisma } from "../../config/prisma";

export type DashboardActivityType =
    | "CHECK_IN"
    | "CHECK_OUT"
    | "LEAVE_REQUEST_CREATED"
    | "LEAVE_REQUEST_APPROVED"
    | "LEAVE_REQUEST_REJECTED";

export type DashboardActivity = {
    type: DashboardActivityType;
    sourceId: string;
    createdAt: Date;
};

export type AttendanceSummary = {
    present: number;
    late: number;
};

export type LeaveSummary = {
    pendingLeaveRequests: number;
    approvedAnnualLeaveCount: number;
};

const todayAttendanceSelect = {
    id: true,
    status: true,
    checkInTime: true,
    checkOutTime: true,
} satisfies Prisma.AttendanceSelect;

export type TodayAttendance = Prisma.AttendanceGetPayload<{
    select: typeof todayAttendanceSelect;
}>;

const getTodayDate = (): Date => {
    const now = new Date();

    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
};

const getMonthDateRange = (
    year: number,
    month: number,
): { startDate: Date; endDate: Date } => ({
    startDate: new Date(Date.UTC(year, month - 1, 1)),
    endDate: new Date(Date.UTC(year, month, 1)),
});

export const dashboardRepository = {
    findTodayAttendance(employeeId: string): Promise<TodayAttendance | null> {
        return prisma.attendance.findFirst({
            where: {
                employeeId,
                attendanceDate: getTodayDate(),
            },
            select: todayAttendanceSelect,
        });
    },

    async getAttendanceSummary(
        employeeId: string,
        year: number,
        month: number,
    ): Promise<AttendanceSummary> {
        const { startDate, endDate } = getMonthDateRange(year, month);

        const [present, late] = await Promise.all([
            prisma.attendance.count({
                where: {
                    employeeId,
                    status: AttendanceStatus.PRESENT,
                    attendanceDate: {
                        gte: startDate,
                        lt: endDate,
                    },
                },
            }),
            prisma.attendance.count({
                where: {
                    employeeId,
                    status: AttendanceStatus.LATE,
                    attendanceDate: {
                        gte: startDate,
                        lt: endDate,
                    },
                },
            }),
        ]);

        return {
            present,
            late,
        };
    },

    async getLeaveSummary(employeeId: string): Promise<LeaveSummary> {
        const [pendingLeaveRequests, approvedAnnualLeaveCount] =
            await Promise.all([
                prisma.leaveRequest.count({
                    where: {
                        employeeId,
                        status: LeaveRequestStatus.PENDING,
                    },
                }),
                prisma.leaveRequest.count({
                    where: {
                        employeeId,
                        leaveType: LeaveType.ANNUAL,
                        status: LeaveRequestStatus.APPROVED,
                    },
                }),
            ]);

        return {
            pendingLeaveRequests,
            approvedAnnualLeaveCount,
        };
    },

    async getRecentActivities(
        employeeId: string,
        limit: number,
    ): Promise<DashboardActivity[]> {
        const [attendances, leaveRequests] = await Promise.all([
            prisma.attendance.findMany({
                where: {
                    employeeId,
                },
                orderBy: {
                    attendanceDate: "desc",
                },
                take: limit,
                select: {
                    id: true,
                    checkInTime: true,
                    checkOutTime: true,
                },
            }),
            prisma.leaveRequest.findMany({
                where: {
                    employeeId,
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: limit,
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    reviewedAt: true,
                },
            }),
        ]);

        const attendanceActivities: DashboardActivity[] = attendances.flatMap(
            (attendance) => {
                const activities: DashboardActivity[] = [
                    {
                        type: "CHECK_IN",
                        sourceId: attendance.id,
                        createdAt: attendance.checkInTime,
                    },
                ];

                if (attendance.checkOutTime) {
                    activities.push({
                        type: "CHECK_OUT",
                        sourceId: attendance.id,
                        createdAt: attendance.checkOutTime,
                    });
                }

                return activities;
            },
        );

        const leaveRequestActivities: DashboardActivity[] =
            leaveRequests.flatMap((leaveRequest) => {
                const activities: DashboardActivity[] = [
                    {
                        type: "LEAVE_REQUEST_CREATED",
                        sourceId: leaveRequest.id,
                        createdAt: leaveRequest.createdAt,
                    },
                ];

                if (
                    leaveRequest.status === LeaveRequestStatus.APPROVED &&
                    leaveRequest.reviewedAt
                ) {
                    activities.push({
                        type: "LEAVE_REQUEST_APPROVED",
                        sourceId: leaveRequest.id,
                        createdAt: leaveRequest.reviewedAt,
                    });
                }

                if (
                    leaveRequest.status === LeaveRequestStatus.REJECTED &&
                    leaveRequest.reviewedAt
                ) {
                    activities.push({
                        type: "LEAVE_REQUEST_REJECTED",
                        sourceId: leaveRequest.id,
                        createdAt: leaveRequest.reviewedAt,
                    });
                }

                return activities;
            });

        return [...attendanceActivities, ...leaveRequestActivities]
            .sort((firstActivity, secondActivity) => {
                return (
                    secondActivity.createdAt.getTime() -
                    firstActivity.createdAt.getTime()
                );
            })
            .slice(0, limit);
    },
};
