import { AttendanceStatus } from "@prisma/client";
import type { Request, Response } from "express";

import type {
    AttendanceSortBy,
    AttendanceSortOrder,
} from "./attendance.repository";
import {
    AttendanceServiceError,
    attendanceService,
} from "./attendance.service";

const allowedSortBy: AttendanceSortBy[] = [
    "attendanceDate",
    "checkInTime",
    "checkOutTime",
    "createdAt",
];

const allowedSortOrder: AttendanceSortOrder[] = ["asc", "desc"];

const getSingleQueryValue = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }

    return undefined;
};

const getAuthenticatedUserId = (req: Request): string => {
    if (!req.user) {
        throw new AttendanceServiceError("Unauthorized", 401);
    }

    return req.user.userId;
};

const parseStatus = (value: unknown): AttendanceStatus | undefined => {
    const status = getSingleQueryValue(value);

    if (!status) {
        return undefined;
    }

    if (
        status === AttendanceStatus.PRESENT ||
        status === AttendanceStatus.LATE
    ) {
        return status;
    }

    throw new AttendanceServiceError("Invalid status", 400);
};

const parseHistorySortBy = (
    value: unknown,
): "attendanceDate" | undefined => {
    const sortBy = getSingleQueryValue(value);

    if (!sortBy) {
        return undefined;
    }

    if (sortBy === "attendanceDate") {
        return sortBy;
    }

    throw new AttendanceServiceError("Invalid sortBy", 400);
};

const parseSortBy = (value: unknown): AttendanceSortBy | undefined => {
    const sortBy = getSingleQueryValue(value);

    if (!sortBy) {
        return undefined;
    }

    if (allowedSortBy.includes(sortBy as AttendanceSortBy)) {
        return sortBy as AttendanceSortBy;
    }

    throw new AttendanceServiceError("Invalid sortBy", 400);
};

const parseSortOrder = (value: unknown): AttendanceSortOrder | undefined => {
    const sortOrder = getSingleQueryValue(value);

    if (!sortOrder) {
        return undefined;
    }

    if (allowedSortOrder.includes(sortOrder as AttendanceSortOrder)) {
        return sortOrder as AttendanceSortOrder;
    }

    throw new AttendanceServiceError("Invalid sortOrder", 400);
};

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof AttendanceServiceError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error",
    });
};

export const attendanceController = {
    async checkIn(req: Request, res: Response): Promise<Response> {
        try {
            const attendance = await attendanceService.checkIn(
                getAuthenticatedUserId(req),
            );

            return res.status(200).json({
                data: attendance,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async checkOut(req: Request, res: Response): Promise<Response> {
        try {
            const attendance = await attendanceService.checkOut(
                getAuthenticatedUserId(req),
            );

            return res.status(200).json({
                data: attendance,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async getAttendanceHistory(
        req: Request,
        res: Response,
    ): Promise<Response> {
        try {
            const result = await attendanceService.getAttendanceHistory(
                getAuthenticatedUserId(req),
                {
                    page: getSingleQueryValue(req.query.page),
                    limit: getSingleQueryValue(req.query.limit),
                    status: parseStatus(req.query.status),
                    fromDate: getSingleQueryValue(req.query.fromDate),
                    toDate: getSingleQueryValue(req.query.toDate),
                    sortBy: parseHistorySortBy(req.query.sortBy),
                    sortOrder: parseSortOrder(req.query.sortOrder),
                },
            );

            return res.status(200).json(result);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async getAttendanceRecords(
        req: Request,
        res: Response,
    ): Promise<Response> {
        try {
            getAuthenticatedUserId(req);

            const result = await attendanceService.getAttendanceRecords({
                page: getSingleQueryValue(req.query.page),
                limit: getSingleQueryValue(req.query.limit),
                search: getSingleQueryValue(req.query.search),
                status: parseStatus(req.query.status),
                employeeId: getSingleQueryValue(req.query.employeeId),
                fromDate: getSingleQueryValue(req.query.fromDate),
                toDate: getSingleQueryValue(req.query.toDate),
                sortBy: parseSortBy(req.query.sortBy),
                sortOrder: parseSortOrder(req.query.sortOrder),
            });

            return res.status(200).json(result);
        } catch (error) {
            return handleError(error, res);
        }
    },
};
