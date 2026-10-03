import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export const adminDashboardRepository = {
    getSnapshot(fromDate: Date, toDate: Date, activityLimit: number) {
        const attendanceGroups = prisma.attendance.groupBy({
            by: ["attendanceDate", "status"],
            where: { attendanceDate: { gte: fromDate, lte: toDate } },
            _count: { _all: true },
        });
        // One consistent snapshot: counts and chart cannot disagree during writes.
        return prisma.$transaction([
            prisma.employee.count(),
            prisma.department.count(),
            prisma.leaveRequest.count(),
            attendanceGroups,
            prisma.attendance.findMany({
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: activityLimit,
                select: { id: true, createdAt: true, employee: { select: { fullName: true } } },
            }),
            prisma.leaveRequest.findMany({
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: activityLimit,
                select: { id: true, createdAt: true, employee: { select: { fullName: true } } },
            }),
            prisma.department.findMany({
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: activityLimit,
                select: { id: true, createdAt: true, name: true },
            }),
        ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    },
};
