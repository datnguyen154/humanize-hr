import { AttendanceStatus, Prisma } from "@prisma/client";

import { employeeRepository } from "../employee/employee.repository";
import {
    attendanceRepository,
    type AttendanceSortBy,
    type AttendanceSortOrder,
    type AttendanceWithEmployee,
} from "./attendance.repository";

type AttendanceHistoryQuery = {
    page?: number | string;
    limit?: number | string;
    status?: AttendanceStatus;
    fromDate?: string;
    toDate?: string;
    sortBy?: "attendanceDate";
    sortOrder?: AttendanceSortOrder;
};

type AttendanceRecordsQuery = {
    page?: number | string;
    limit?: number | string;
    search?: string;
    status?: AttendanceStatus;
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: AttendanceSortBy;
    sortOrder?: AttendanceSortOrder;
};

type AttendanceMeta = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

type AttendanceListResult = {
    data: AttendanceWithEmployee[];
    meta: AttendanceMeta;
};

export class AttendanceServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "AttendanceServiceError";
    }
}

const COMPANY_TIME_ZONE = "Asia/Bangkok";
const CHECK_IN_CUTOFF_SECONDS = 8 * 60 * 60;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const companyDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: COMPANY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
});

const getDateTimePart = (
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
): number => {
    const value = parts.find((part) => part.type === type)?.value;

    if (!value) {
        throw new Error(`Cannot determine company ${type}`);
    }

    return Number(value);
};

const getCompanyDateContext = (
    date: Date,
): { attendanceDate: Date; secondsSinceMidnight: number } => {
    const parts = companyDateTimeFormatter.formatToParts(date);
    const year = getDateTimePart(parts, "year");
    const month = getDateTimePart(parts, "month");
    const day = getDateTimePart(parts, "day");
    const hour = getDateTimePart(parts, "hour");
    const minute = getDateTimePart(parts, "minute");
    const second = getDateTimePart(parts, "second");

    return {
        attendanceDate: new Date(Date.UTC(year, month - 1, day)),
        secondsSinceMidnight: hour * 60 * 60 + minute * 60 + second,
    };
};

const getEmployeeProfile = async (userId: string | undefined) => {
    if (!userId || !UUID_REGEX.test(userId)) {
        throw new AttendanceServiceError("Employee profile not found", 404);
    }

    const employee = await employeeRepository.findEmployeeByUserId(userId);

    if (!employee) {
        throw new AttendanceServiceError("Employee profile not found", 404);
    }

    return employee;
};

const parsePositiveInteger = (
    value: number | string | undefined,
    defaultValue: number,
): number => {
    if (value === undefined || value === "") {
        return defaultValue;
    }

    const parsedValue = typeof value === "number" ? value : Number(value);

    return Number.isInteger(parsedValue) ? parsedValue : Number.NaN;
};

const normalizePagination = (
    pageInput: number | string | undefined,
    limitInput: number | string | undefined,
): { page: number; limit: number; skip: number; take: number } => {
    const page = parsePositiveInteger(pageInput, DEFAULT_PAGE);
    const limit = parsePositiveInteger(limitInput, DEFAULT_LIMIT);

    if (page < 1 || Number.isNaN(page)) {
        throw new AttendanceServiceError("Invalid page", 400);
    }

    if (limit < 1 || limit > MAX_LIMIT || Number.isNaN(limit)) {
        throw new AttendanceServiceError("Invalid limit", 400);
    }

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
};

const parseOptionalDate = (
    value: string | undefined,
    fieldName: "fromDate" | "toDate",
): Date | undefined => {
    if (value === undefined || value === "") {
        return undefined;
    }

    const match = DATE_REGEX.exec(value);

    if (!match) {
        throw new AttendanceServiceError(`Invalid ${fieldName}`, 400);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
        parsedDate.getUTCFullYear() !== year ||
        parsedDate.getUTCMonth() !== month - 1 ||
        parsedDate.getUTCDate() !== day
    ) {
        throw new AttendanceServiceError(`Invalid ${fieldName}`, 400);
    }

    return parsedDate;
};

const normalizeDateRange = (
    fromDateInput?: string,
    toDateInput?: string,
): { fromDate?: Date; toDate?: Date } => {
    const fromDate = parseOptionalDate(fromDateInput, "fromDate");
    const toDate = parseOptionalDate(toDateInput, "toDate");

    if (fromDate && toDate && fromDate > toDate) {
        throw new AttendanceServiceError(
            "fromDate must be before or equal toDate",
            400,
        );
    }

    return { fromDate, toDate };
};

const buildListResult = (
    data: AttendanceWithEmployee[],
    totalItems: number,
    page: number,
    limit: number,
): AttendanceListResult => {
    const totalPages = Math.ceil(totalItems / limit);

    return {
        data,
        meta: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1 && totalPages > 0,
        },
    };
};

export const attendanceService = {
    async checkIn(userId: string | undefined): Promise<AttendanceWithEmployee> {
        const employee = await getEmployeeProfile(userId);
        const now = new Date();
        const { attendanceDate, secondsSinceMidnight } =
            getCompanyDateContext(now);
        const existingAttendance =
            await attendanceRepository.findAttendanceByEmployeeAndDate(
                employee.id,
                attendanceDate,
            );

        if (existingAttendance) {
            throw new AttendanceServiceError(
                "Already checked in today",
                409,
            );
        }

        const status =
            secondsSinceMidnight <= CHECK_IN_CUTOFF_SECONDS
                ? AttendanceStatus.PRESENT
                : AttendanceStatus.LATE;

        try {
            return await attendanceRepository.createAttendance({
                employeeId: employee.id,
                attendanceDate,
                checkInTime: now,
                checkOutTime: null,
                status,
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new AttendanceServiceError(
                    "Already checked in today",
                    409,
                );
            }

            throw error;
        }
    },

    async checkOut(
        userId: string | undefined,
    ): Promise<AttendanceWithEmployee> {
        const employee = await getEmployeeProfile(userId);
        const now = new Date();
        const { attendanceDate } = getCompanyDateContext(now);
        const attendance =
            await attendanceRepository.findAttendanceByEmployeeAndDate(
                employee.id,
                attendanceDate,
            );

        if (!attendance) {
            throw new AttendanceServiceError(
                "Check in required before check out",
                400,
            );
        }

        if (attendance.checkOutTime) {
            throw new AttendanceServiceError(
                "Already checked out today",
                409,
            );
        }

        return attendanceRepository.updateAttendance(attendance.id, {
            checkOutTime: now,
        });
    },

    async getAttendanceHistory(
        userId: string | undefined,
        query: AttendanceHistoryQuery = {},
    ): Promise<AttendanceListResult> {
        const employee = await getEmployeeProfile(userId);
        const { page, limit, skip, take } = normalizePagination(
            query.page,
            query.limit,
        );
        const { fromDate, toDate } = normalizeDateRange(
            query.fromDate,
            query.toDate,
        );
        const repositoryParams = {
            employeeId: employee.id,
            status: query.status,
            fromDate,
            toDate,
            skip,
            take,
            sortOrder: query.sortOrder,
        };

        const [records, totalItems] = await Promise.all([
            attendanceRepository.findAttendanceHistory(repositoryParams),
            attendanceRepository.countAttendanceHistory(repositoryParams),
        ]);

        return buildListResult(records, totalItems, page, limit);
    },

    async getAttendanceRecords(
        query: AttendanceRecordsQuery = {},
    ): Promise<AttendanceListResult> {
        const { page, limit, skip, take } = normalizePagination(
            query.page,
            query.limit,
        );
        const { fromDate, toDate } = normalizeDateRange(
            query.fromDate,
            query.toDate,
        );

        if (query.employeeId && !UUID_REGEX.test(query.employeeId)) {
            throw new AttendanceServiceError("Invalid employeeId", 400);
        }

        const repositoryParams = {
            search: query.search,
            status: query.status,
            employeeId: query.employeeId,
            fromDate,
            toDate,
            skip,
            take,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        };

        const [records, totalItems] = await Promise.all([
            attendanceRepository.findAttendanceRecords(repositoryParams),
            attendanceRepository.countAttendanceRecords(repositoryParams),
        ]);

        return buildListResult(records, totalItems, page, limit);
    },
};
