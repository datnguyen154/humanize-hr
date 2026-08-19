import type {
    LeaveRequestStatus,
    Prisma,
    User,
} from "@prisma/client";

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

export type LeaveRequestApprover = Pick<
    User,
    "id" | "fullName" | "email"
>;

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
    approver: {
        select: {
            id: true,
            fullName: true,
            email: true,
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

    findApproverById(id: string): Promise<Pick<User, "id" | "role" | "status"> | null> {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                role: true,
                status: true,
            },
        });
    },

    findEligibleApprovers(): Promise<LeaveRequestApprover[]> {
        return prisma.user.findMany({
            where: {
                role: "ADMIN",
                status: "ACTIVE",
            },
            select: {
                id: true,
                fullName: true,
                email: true,
            },
            orderBy: {
                fullName: "asc",
            },
        });
    },

    updateLeaveRequestApprover(
        id: string,
        approverId: string,
    ): Promise<LeaveRequestWithRelations> {
        return prisma.leaveRequest.update({
            where: { id },
            data: { approverId },
            include: leaveRequestRelations,
        });
    },
};
