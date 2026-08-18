import type { AttendanceStatus, Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export type AttendanceSortBy =
    | "attendanceDate"
    | "checkInTime"
    | "checkOutTime"
    | "createdAt";

export type AttendanceSortOrder = "asc" | "desc";

export type AttendanceHistoryParams = {
    employeeId: string;
    status?: AttendanceStatus;
    fromDate?: Date;
    toDate?: Date;
    skip?: number;
    take?: number;
    sortOrder?: AttendanceSortOrder;
};

export type AttendanceRecordParams = {
    search?: string;
    status?: AttendanceStatus;
    employeeId?: string;
    fromDate?: Date;
    toDate?: Date;
    skip?: number;
    take?: number;
    sortBy?: AttendanceSortBy;
    sortOrder?: AttendanceSortOrder;
};

export type CreateAttendanceData = Prisma.AttendanceUncheckedCreateInput;
export type UpdateAttendanceData = Prisma.AttendanceUncheckedUpdateInput;

const attendanceEmployeeRelation = {
    employee: {
        select: {
            id: true,
            employeeCode: true,
            fullName: true,
        },
    },
} satisfies Prisma.AttendanceInclude;

export type AttendanceWithEmployee = Prisma.AttendanceGetPayload<{
    include: typeof attendanceEmployeeRelation;
}>;

const buildDateRange = (
    fromDate?: Date,
    toDate?: Date,
): Prisma.DateTimeFilter | undefined => {
    if (!fromDate && !toDate) {
        return undefined;
    }

    return {
        gte: fromDate,
        lte: toDate,
    };
};

const buildAttendanceHistoryWhere = (
    params: AttendanceHistoryParams,
): Prisma.AttendanceWhereInput => ({
    employeeId: params.employeeId,
    status: params.status,
    attendanceDate: buildDateRange(params.fromDate, params.toDate),
});

const buildAttendanceRecordWhere = (
    params: AttendanceRecordParams,
): Prisma.AttendanceWhereInput => {
    const where: Prisma.AttendanceWhereInput = {
        status: params.status,
        employeeId: params.employeeId,
        attendanceDate: buildDateRange(params.fromDate, params.toDate),
    };
    const search = params.search?.trim();

    if (search) {
        where.employee = {
            is: {
                OR: [
                    {
                        fullName: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        employeeCode: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            },
        };
    }

    return where;
};

const buildAttendanceOrderBy = (
    sortBy: AttendanceSortBy = "attendanceDate",
    sortOrder: AttendanceSortOrder = "desc",
): Prisma.AttendanceOrderByWithRelationInput => ({
    [sortBy]: sortOrder,
});

export const attendanceRepository = {
    findAttendanceByEmployeeAndDate(
        employeeId: string,
        attendanceDate: Date,
    ): Promise<AttendanceWithEmployee | null> {
        return prisma.attendance.findUnique({
            where: {
                employeeId_attendanceDate: {
                    employeeId,
                    attendanceDate,
                },
            },
            include: attendanceEmployeeRelation,
        });
    },

    createAttendance(
        data: CreateAttendanceData,
    ): Promise<AttendanceWithEmployee> {
        return prisma.attendance.create({
            data,
            include: attendanceEmployeeRelation,
        });
    },

    updateAttendance(
        id: string,
        data: UpdateAttendanceData,
    ): Promise<AttendanceWithEmployee> {
        return prisma.attendance.update({
            where: { id },
            data,
            include: attendanceEmployeeRelation,
        });
    },

    findAttendanceHistory(
        params: AttendanceHistoryParams,
    ): Promise<AttendanceWithEmployee[]> {
        return prisma.attendance.findMany({
            where: buildAttendanceHistoryWhere(params),
            orderBy: buildAttendanceOrderBy(
                "attendanceDate",
                params.sortOrder,
            ),
            skip: params.skip,
            take: params.take,
            include: attendanceEmployeeRelation,
        });
    },

    countAttendanceHistory(params: AttendanceHistoryParams): Promise<number> {
        return prisma.attendance.count({
            where: buildAttendanceHistoryWhere(params),
        });
    },

    countLateAttendance(
        employeeId: string,
        fromDate: Date,
        toDate: Date,
    ): Promise<number> {
        return prisma.attendance.count({
            where: {
                employeeId,
                status: "LATE",
                attendanceDate: {
                    gte: fromDate,
                    lt: toDate,
                },
            },
        });
    },

    findAttendanceRecords(
        params: AttendanceRecordParams,
    ): Promise<AttendanceWithEmployee[]> {
        return prisma.attendance.findMany({
            where: buildAttendanceRecordWhere(params),
            orderBy: buildAttendanceOrderBy(
                params.sortBy,
                params.sortOrder,
            ),
            skip: params.skip,
            take: params.take,
            include: attendanceEmployeeRelation,
        });
    },

    countAttendanceRecords(params: AttendanceRecordParams): Promise<number> {
        return prisma.attendance.count({
            where: buildAttendanceRecordWhere(params),
        });
    },
};
