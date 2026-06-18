import { LeaveRequestStatus } from "@prisma/client";
import type { Request, Response } from "express";

import type {
    LeaveRequestSortBy,
    LeaveRequestSortOrder,
} from "./leave-request.repository";
import {
    LeaveRequestServiceError,
    leaveRequestService,
} from "./leave-request.service";

const allowedSortBy: LeaveRequestSortBy[] = [
    "createdAt",
    "startDate",
    "endDate",
];

const allowedSortOrder: LeaveRequestSortOrder[] = ["asc", "desc"];

const getSingleQueryValue = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }

    return undefined;
};

const parseStatus = (value: unknown): LeaveRequestStatus | undefined => {
    const status = getSingleQueryValue(value);

    if (!status) {
        return undefined;
    }

    if (
        status === LeaveRequestStatus.PENDING ||
        status === LeaveRequestStatus.APPROVED ||
        status === LeaveRequestStatus.REJECTED
    ) {
        return status;
    }

    throw new LeaveRequestServiceError("Invalid status", 400);
};

const parseSortBy = (value: unknown): LeaveRequestSortBy | undefined => {
    const sortBy = getSingleQueryValue(value);

    if (!sortBy) {
        return undefined;
    }

    if (allowedSortBy.includes(sortBy as LeaveRequestSortBy)) {
        return sortBy as LeaveRequestSortBy;
    }

    throw new LeaveRequestServiceError("Invalid sortBy", 400);
};

const parseSortOrder = (
    value: unknown,
): LeaveRequestSortOrder | undefined => {
    const sortOrder = getSingleQueryValue(value);

    if (!sortOrder) {
        return undefined;
    }

    if (allowedSortOrder.includes(sortOrder as LeaveRequestSortOrder)) {
        return sortOrder as LeaveRequestSortOrder;
    }

    throw new LeaveRequestServiceError("Invalid sortOrder", 400);
};

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof LeaveRequestServiceError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error",
    });
};

export const leaveRequestController = {
    async getLeaveRequests(req: Request, res: Response): Promise<Response> {
        try {
            const result = await leaveRequestService.getLeaveRequests({
                page: getSingleQueryValue(req.query.page),
                limit: getSingleQueryValue(req.query.limit),
                search: getSingleQueryValue(req.query.search),
                status: parseStatus(req.query.status),
                employeeId: getSingleQueryValue(req.query.employeeId),
                sortBy: parseSortBy(req.query.sortBy),
                sortOrder: parseSortOrder(req.query.sortOrder),
            });

            return res.status(200).json(result);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async getLeaveRequestById(
        req: Request,
        res: Response,
    ): Promise<Response> {
        try {
            const leaveRequest =
                await leaveRequestService.getLeaveRequestById(req.params.id);

            return res.status(200).json({
                data: leaveRequest,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async createLeaveRequest(req: Request, res: Response): Promise<Response> {
        try {
            const { employeeId, leaveType, startDate, endDate, reason } =
                req.body as {
                    employeeId?: string;
                    leaveType?: string;
                    startDate?: string;
                    endDate?: string;
                    reason?: string;
                };

            const leaveRequest =
                await leaveRequestService.createLeaveRequest({
                    employeeId,
                    leaveType,
                    startDate,
                    endDate,
                    reason,
                });

            return res.status(201).json({
                data: leaveRequest,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async updateLeaveRequestStatus(
        req: Request,
        res: Response,
    ): Promise<Response> {
        try {
            const { status, reviewNote } = req.body as {
                status?: string;
                reviewNote?: string | null;
            };

            const leaveRequest =
                await leaveRequestService.updateLeaveRequestStatus(
                    req.params.id,
                    {
                        status,
                        reviewedBy: req.user?.userId,
                        reviewNote,
                    },
                );

            return res.status(200).json({
                data: leaveRequest,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },
};
