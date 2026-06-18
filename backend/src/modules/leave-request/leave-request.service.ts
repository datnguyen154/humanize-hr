import { LeaveRequestStatus, LeaveType } from "@prisma/client";

import { employeeRepository } from "../employee/employee.repository";
import {
    leaveRequestRepository,
    type LeaveRequestSortBy,
    type LeaveRequestSortOrder,
    type LeaveRequestWithRelations,
} from "./leave-request.repository";

type GetLeaveRequestsQuery = {
    page?: number | string;
    limit?: number | string;
    search?: string;
    status?: LeaveRequestStatus;
    employeeId?: string;
    sortBy?: LeaveRequestSortBy;
    sortOrder?: LeaveRequestSortOrder;
};

type GetLeaveRequestsMeta = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

type GetLeaveRequestsResult = {
    data: LeaveRequestWithRelations[];
    meta: GetLeaveRequestsMeta;
};

type CreateLeaveRequestInput = {
    employeeId?: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
};

type UpdateLeaveRequestStatusInput = {
    status?: string;
    reviewedBy?: string;
    reviewNote?: string | null;
};

export class LeaveRequestServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "LeaveRequestServiceError";
    }
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const parseRequiredString = (value: unknown, fieldName: string): string => {
    if (!isNonEmptyString(value)) {
        throw new LeaveRequestServiceError(
            `${fieldName} is required`,
            400,
        );
    }

    return value.trim();
};

const parseRequiredUuid = (value: unknown, fieldName: string): string => {
    const parsedValue = parseRequiredString(value, fieldName);

    if (!UUID_REGEX.test(parsedValue)) {
        throw new LeaveRequestServiceError(`Invalid ${fieldName}`, 400);
    }

    return parsedValue;
};

const parseLeaveType = (value: unknown): LeaveType => {
    if (!isNonEmptyString(value)) {
        throw new LeaveRequestServiceError("leaveType is required", 400);
    }

    if (
        value === LeaveType.ANNUAL ||
        value === LeaveType.SICK ||
        value === LeaveType.UNPAID ||
        value === LeaveType.OTHER
    ) {
        return value;
    }

    throw new LeaveRequestServiceError("Invalid leaveType", 400);
};

const parseRequiredDate = (value: unknown, fieldName: string): Date => {
    if (!isNonEmptyString(value)) {
        throw new LeaveRequestServiceError(`${fieldName} is required`, 400);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new LeaveRequestServiceError(`Invalid ${fieldName}`, 400);
    }

    return date;
};

const parseReviewStatus = (value: unknown): LeaveRequestStatus => {
    if (
        value === LeaveRequestStatus.APPROVED ||
        value === LeaveRequestStatus.REJECTED
    ) {
        return value;
    }

    throw new LeaveRequestServiceError(
        "status must be APPROVED or REJECTED",
        400,
    );
};

const normalizeOptionalString = (
    value: string | null | undefined,
): string | null => {
    if (value === undefined || value === null) {
        return null;
    }

    return value.trim();
};

const parsePositiveInteger = (
    value: number | string | undefined,
    defaultValue: number,
): number => {
    if (value === undefined || value === "") {
        return defaultValue;
    }

    const parsedValue = typeof value === "number" ? value : Number(value);

    if (!Number.isInteger(parsedValue)) {
        return Number.NaN;
    }

    return parsedValue;
};

const normalizePagination = (
    pageInput: number | string | undefined,
    limitInput: number | string | undefined,
): { page: number; limit: number; skip: number; take: number } => {
    const page = parsePositiveInteger(pageInput, DEFAULT_PAGE);
    const limit = parsePositiveInteger(limitInput, DEFAULT_LIMIT);

    if (page < 1 || Number.isNaN(page)) {
        throw new LeaveRequestServiceError("Invalid page", 400);
    }

    if (limit < 1 || limit > MAX_LIMIT || Number.isNaN(limit)) {
        throw new LeaveRequestServiceError("Invalid limit", 400);
    }

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
};

export const leaveRequestService = {
    async getLeaveRequests(
        query: GetLeaveRequestsQuery = {},
    ): Promise<GetLeaveRequestsResult> {
        const { page, limit, skip, take } = normalizePagination(
            query.page,
            query.limit,
        );

        if (query.employeeId && !UUID_REGEX.test(query.employeeId)) {
            throw new LeaveRequestServiceError("Invalid employeeId", 400);
        }

        const repositoryParams = {
            skip,
            take,
            search: query.search,
            status: query.status,
            employeeId: query.employeeId,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        };

        const [leaveRequests, totalItems] = await Promise.all([
            leaveRequestRepository.findLeaveRequests(repositoryParams),
            leaveRequestRepository.countLeaveRequests(repositoryParams),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data: leaveRequests,
            meta: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1 && totalPages > 0,
            },
        };
    },

    async getLeaveRequestById(
        id: string,
    ): Promise<LeaveRequestWithRelations> {
        if (!UUID_REGEX.test(id)) {
            throw new LeaveRequestServiceError(
                "Leave request not found",
                404,
            );
        }

        const leaveRequest =
            await leaveRequestRepository.findLeaveRequestById(id);

        if (!leaveRequest) {
            throw new LeaveRequestServiceError(
                "Leave request not found",
                404,
            );
        }

        return leaveRequest;
    },

    async createLeaveRequest(
        data: CreateLeaveRequestInput,
    ): Promise<LeaveRequestWithRelations> {
        const employeeId = parseRequiredUuid(data.employeeId, "employeeId");
        const leaveType = parseLeaveType(data.leaveType);
        const startDate = parseRequiredDate(data.startDate, "startDate");
        const endDate = parseRequiredDate(data.endDate, "endDate");
        const reason = parseRequiredString(data.reason, "reason");

        if (startDate > endDate) {
            throw new LeaveRequestServiceError(
                "startDate must be before or equal endDate",
                400,
            );
        }

        const employee = await employeeRepository.findEmployeeById(employeeId);

        if (!employee) {
            throw new LeaveRequestServiceError("Employee not found", 404);
        }

        return leaveRequestRepository.createLeaveRequest({
            employeeId,
            leaveType,
            startDate,
            endDate,
            reason,
            status: LeaveRequestStatus.PENDING,
            reviewedBy: null,
            reviewedAt: null,
            reviewNote: null,
        });
    },

    async updateLeaveRequestStatus(
        id: string,
        data: UpdateLeaveRequestStatusInput,
    ): Promise<LeaveRequestWithRelations> {
        if (!UUID_REGEX.test(id)) {
            throw new LeaveRequestServiceError(
                "Leave request not found",
                404,
            );
        }

        const leaveRequest =
            await leaveRequestRepository.findLeaveRequestById(id);

        if (!leaveRequest) {
            throw new LeaveRequestServiceError(
                "Leave request not found",
                404,
            );
        }

        const status = parseReviewStatus(data.status);

        if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
            throw new LeaveRequestServiceError(
                "Leave request has already been reviewed",
                400,
            );
        }

        const reviewedBy = parseRequiredUuid(data.reviewedBy, "reviewedBy");
        const reviewNote = normalizeOptionalString(data.reviewNote);

        return leaveRequestRepository.updateLeaveRequestStatus(id, {
            status,
            reviewedBy,
            reviewedAt: new Date(),
            reviewNote,
        });
    },
};
