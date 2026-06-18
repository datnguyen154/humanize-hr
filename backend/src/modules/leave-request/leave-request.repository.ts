import type { LeaveRequestStatus, Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export type LeaveRequestSortBy = "createdAt" | "startDate" | "endDate";

export type LeaveRequestSortOrder = "asc" | "desc";

export type LeaveRequestQueryParams = {
    skip?: number;
    take?: number;
    search?: string;
    status?: LeaveRequestStatus;
    employeeId?: string;
    sortBy?: LeaveRequestSortBy;
    sortOrder?: LeaveRequestSortOrder;
};

export type CreateLeaveRequestData = Prisma.LeaveRequestUncheckedCreateInput;
export type UpdateLeaveRequestStatusData =
    Prisma.LeaveRequestUncheckedUpdateInput;

const leaveRequestRelations = {
    employee: {
        select: {
            id: true,
            employeeCode: true,
            fullName: true,
        },
    },
    reviewer: {
        select: {
            id: true,
            fullName: true,
        },
    },
} satisfies Prisma.LeaveRequestInclude;

export type LeaveRequestWithRelations = Prisma.LeaveRequestGetPayload<{
    include: typeof leaveRequestRelations;
}>;

const buildLeaveRequestWhere = (
    params: LeaveRequestQueryParams,
): Prisma.LeaveRequestWhereInput => {
    const where: Prisma.LeaveRequestWhereInput = {};
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

    if (params.status) {
        where.status = params.status;
    }

    if (params.employeeId) {
        where.employeeId = params.employeeId;
    }

    return where;
};

const buildLeaveRequestOrderBy = (
    params: LeaveRequestQueryParams,
): Prisma.LeaveRequestOrderByWithRelationInput => {
    const sortBy = params.sortBy ?? "createdAt";
    const sortOrder = params.sortOrder ?? "desc";

    return {
        [sortBy]: sortOrder,
    };
};

export const leaveRequestRepository = {
    findLeaveRequests(
        params: LeaveRequestQueryParams,
    ): Promise<LeaveRequestWithRelations[]> {
        return prisma.leaveRequest.findMany({
            where: buildLeaveRequestWhere(params),
            orderBy: buildLeaveRequestOrderBy(params),
            skip: params.skip,
            take: params.take,
            include: leaveRequestRelations,
        });
    },

    countLeaveRequests(params: LeaveRequestQueryParams): Promise<number> {
        return prisma.leaveRequest.count({
            where: buildLeaveRequestWhere(params),
        });
    },

    findLeaveRequestById(
        id: string,
    ): Promise<LeaveRequestWithRelations | null> {
        return prisma.leaveRequest.findUnique({
            where: { id },
            include: leaveRequestRelations,
        });
    },

    createLeaveRequest(
        data: CreateLeaveRequestData,
    ): Promise<LeaveRequestWithRelations> {
        return prisma.leaveRequest.create({
            data,
            include: leaveRequestRelations,
        });
    },

    updateLeaveRequestStatus(
        id: string,
        data: UpdateLeaveRequestStatusData,
    ): Promise<LeaveRequestWithRelations> {
        return prisma.leaveRequest.update({
            where: { id },
            data,
            include: leaveRequestRelations,
        });
    },
};
