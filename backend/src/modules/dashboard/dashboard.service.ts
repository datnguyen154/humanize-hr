import type { AttendanceStatus } from "@prisma/client";

import { employeeRepository } from "../employee/employee.repository";
import {
    dashboardRepository,
    type AttendanceSummary,
    type DashboardActivity,
    type DashboardActivityType,
} from "./dashboard.repository";

type TodayAttendance = {
    status: AttendanceStatus | null;
    checkInTime: Date | null;
    checkOutTime: Date | null;
};

type LeaveSummary = {
    pendingLeaveRequests: number;
    usedAnnualLeave: number;
    remainingAnnualLeave: number;
};

type RecentActivity = {
    type: DashboardActivityType;
    message: string;
    createdAt: Date;
};

type EmployeeDashboard = {
    todayAttendance: TodayAttendance;
    attendanceSummary: AttendanceSummary;
    leaveSummary: LeaveSummary;
    recentActivities: RecentActivity[];
};

export class DashboardServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "DashboardServiceError";
    }
}

const ANNUAL_LEAVE_QUOTA = 12;
const RECENT_ACTIVITY_LIMIT = 5;

const getCurrentYearAndMonth = (): { year: number; month: number } => {
    const now = new Date();

    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
    };
};

const toTodayAttendance = (
    todayAttendance: Awaited<
        ReturnType<typeof dashboardRepository.findTodayAttendance>
    >,
): TodayAttendance => {
    if (!todayAttendance) {
        return {
            status: null,
            checkInTime: null,
            checkOutTime: null,
        };
    }

    return {
        status: todayAttendance.status,
        checkInTime: todayAttendance.checkInTime,
        checkOutTime: todayAttendance.checkOutTime,
    };
};

const getActivityMessage = (activity: DashboardActivity): string => {
    switch (activity.type) {
        case "CHECK_IN":
            return "You checked in";
        case "CHECK_OUT":
            return "You checked out";
        case "LEAVE_REQUEST_CREATED":
            return "Leave request created";
        case "LEAVE_REQUEST_APPROVED":
            return "Leave request approved";
        case "LEAVE_REQUEST_REJECTED":
            return "Leave request rejected";
    }
};

const toRecentActivity = (activity: DashboardActivity): RecentActivity => ({
    type: activity.type,
    message: getActivityMessage(activity),
    createdAt: activity.createdAt,
});

export const dashboardService = {
    async getEmployeeDashboard(
        userId: string | undefined,
    ): Promise<EmployeeDashboard> {
        if (!userId) {
            throw new DashboardServiceError("Unauthorized", 401);
        }

        const employee = await employeeRepository.findEmployeeByUserId(userId);

        if (!employee) {
            throw new DashboardServiceError(
                "Employee profile not found",
                404,
            );
        }

        const { year, month } = getCurrentYearAndMonth();

        const [
            todayAttendance,
            attendanceSummary,
            leaveSummary,
            recentActivities,
        ] = await Promise.all([
            dashboardRepository.findTodayAttendance(employee.id),
            dashboardRepository.getAttendanceSummary(employee.id, year, month),
            dashboardRepository.getLeaveSummary(employee.id),
            dashboardRepository.getRecentActivities(
                employee.id,
                RECENT_ACTIVITY_LIMIT,
            ),
        ]);

        const usedAnnualLeave = leaveSummary.approvedAnnualLeaveCount;

        return {
            todayAttendance: toTodayAttendance(todayAttendance),
            attendanceSummary,
            leaveSummary: {
                pendingLeaveRequests: leaveSummary.pendingLeaveRequests,
                usedAnnualLeave,
                remainingAnnualLeave: ANNUAL_LEAVE_QUOTA - usedAnnualLeave,
            },
            recentActivities: recentActivities.map(toRecentActivity),
        };
    },
};
