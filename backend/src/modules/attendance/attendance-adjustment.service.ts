import { AttendanceAdjustmentStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { employeeRepository } from "../employee/employee.repository";
import { attendanceAdjustmentRepository } from "./attendance-adjustment.repository";
import { notificationService } from "../notification/notification.service";
import { getAttendanceStatus, getCompanyDateContext } from "./attendance.service";

export class AttendanceAdjustmentError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message);
        this.name = "AttendanceAdjustmentError";
    }
}

type Actor = { userId: string; role: Role };
type CreateInput = {
    attendanceDate?: unknown;
    checkInTime?: unknown;
    checkOutTime?: unknown;
    reason?: unknown;
};
type ListInput = { page?: unknown; limit?: unknown; status?: unknown; search?: unknown };
type ReviewInput = { status?: unknown; reviewNote?: unknown };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const PAGE_LIMIT = 100;

const requiredText = (value: unknown, field: string) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new AttendanceAdjustmentError(`${field} is required`, 400);
    }
    const result = value.trim();
    if (result.length > 1000) {
        throw new AttendanceAdjustmentError(`${field} is too long`, 400);
    }
    return result;
};

const parseDate = (value: unknown): Date => {
    if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
        throw new AttendanceAdjustmentError("Invalid attendanceDate", 400);
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new AttendanceAdjustmentError("Invalid attendanceDate", 400);
    }
    return date;
};

const parseTime = (value: unknown, field: string, optional = false): Date | null => {
    if (optional && (value === null || value === undefined || value === "")) return null;
    if (typeof value !== "string" || !TIME_PATTERN.test(value)) {
        throw new AttendanceAdjustmentError(`Invalid ${field}`, 400);
    }
    const time = new Date(value);
    if (Number.isNaN(time.getTime())) {
        throw new AttendanceAdjustmentError(`Invalid ${field}`, 400);
    }
    return time;
};

const parsePositiveInt = (value: unknown, fallback: number, maximum: number, field: string) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        throw new AttendanceAdjustmentError(`Invalid ${field}`, 400);
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed > maximum) {
        throw new AttendanceAdjustmentError(`Invalid ${field}`, 400);
    }
    return parsed;
};

const parseStatus = (value: unknown, review = false): AttendanceAdjustmentStatus | undefined => {
    if (value === undefined && !review) return undefined;
    if (value === AttendanceAdjustmentStatus.APPROVED || value === AttendanceAdjustmentStatus.REJECTED) return value;
    if (!review && value === AttendanceAdjustmentStatus.PENDING) return value;
    throw new AttendanceAdjustmentError("Invalid status", 400);
};

const getEmployeeId = async (actor: Actor) => {
    const employee = await employeeRepository.findEmployeeByUserId(actor.userId);
    if (!employee) throw new AttendanceAdjustmentError("Employee profile not found", 404);
    return employee.id;
};

const findVisibleRequest = async (id: string, actor: Actor) => {
    if (!UUID_PATTERN.test(id)) throw new AttendanceAdjustmentError("Attendance adjustment not found", 404);
    const request = await attendanceAdjustmentRepository.findById(id);
    if (!request) throw new AttendanceAdjustmentError("Attendance adjustment not found", 404);
    if (actor.role === Role.EMPLOYEE && request.employeeId !== await getEmployeeId(actor)) {
        throw new AttendanceAdjustmentError("Attendance adjustment not found", 404);
    }
    return request;
};

export const attendanceAdjustmentService = {
    async list(actor: Actor, query: ListInput) {
        const page = parsePositiveInt(query.page, 1, 1000000, "page");
        const limit = parsePositiveInt(query.limit, 10, PAGE_LIMIT, "limit");
        const status = parseStatus(query.status);
        if (query.search !== undefined && typeof query.search !== "string") {
            throw new AttendanceAdjustmentError("Invalid search", 400);
        }
        const params = {
            employeeId: actor.role === Role.EMPLOYEE ? await getEmployeeId(actor) : undefined,
            status,
            search: actor.role === Role.ADMIN ? query.search as string | undefined : undefined,
            skip: (page - 1) * limit,
            take: limit,
        };
        const [data, totalItems] = await Promise.all([
            attendanceAdjustmentRepository.findMany(params),
            attendanceAdjustmentRepository.count(params),
        ]);
        const totalPages = Math.ceil(totalItems / limit);
        return {
            data,
            meta: {
                page, limit, totalItems, totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1 && totalPages > 0,
            },
        };
    },

    getById(id: string, actor: Actor) {
        return findVisibleRequest(id, actor);
    },

    async create(actor: Actor, input: CreateInput) {
        if (actor.role !== Role.EMPLOYEE) throw new AttendanceAdjustmentError("Forbidden", 403);
        const employeeId = await getEmployeeId(actor);
        const attendanceDate = parseDate(input.attendanceDate);
        const checkInTime = parseTime(input.checkInTime, "checkInTime")!;
        const checkOutTime = parseTime(input.checkOutTime, "checkOutTime", true);
        const reason = requiredText(input.reason, "reason");
        const now = new Date();
        if (attendanceDate > getCompanyDateContext(now).attendanceDate || checkInTime > now ||
            (checkOutTime && checkOutTime > now)) {
            throw new AttendanceAdjustmentError("Future attendance is not allowed", 400);
        }
        if (getCompanyDateContext(checkInTime).attendanceDate.getTime() !== attendanceDate.getTime() ||
            (checkOutTime && getCompanyDateContext(checkOutTime).attendanceDate.getTime() !== attendanceDate.getTime()) ||
            (checkOutTime && checkOutTime <= checkInTime)) {
            throw new AttendanceAdjustmentError("Invalid attendance times", 400);
        }
        const current = await attendanceAdjustmentRepository.findAttendance(employeeId, attendanceDate);
        if (current?.checkInTime.getTime() === checkInTime.getTime() &&
            (current.checkOutTime?.getTime() ?? null) === (checkOutTime?.getTime() ?? null)) {
            throw new AttendanceAdjustmentError("No changes requested", 400);
        }
        try {
            return await prisma.$transaction(async (tx) => {
                const request = await attendanceAdjustmentRepository.create({
                    employeeId, attendanceId: current?.id ?? null, attendanceDate,
                    originalCheckInTime: current?.checkInTime ?? null,
                    originalCheckOutTime: current?.checkOutTime ?? null,
                    originalUpdatedAt: current?.updatedAt ?? null,
                    requestedCheckInTime: checkInTime,
                    requestedCheckOutTime: checkOutTime,
                    reason,
                }, tx);
                await notificationService.createAttendanceAdjustmentCreatedNotifications({
                    id: request.id,
                    employeeFullName: request.employee.fullName,
                    attendanceDate: request.attendanceDate,
                }, tx);
                return request;
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new AttendanceAdjustmentError("A pending adjustment already exists for this date", 409);
            }
            throw error;
        }
    },

    async review(id: string, actor: Actor, input: ReviewInput) {
        if (actor.role !== Role.ADMIN) throw new AttendanceAdjustmentError("Forbidden", 403);
        if (!UUID_PATTERN.test(id)) throw new AttendanceAdjustmentError("Attendance adjustment not found", 404);
        const status = parseStatus(input.status, true)!;
        const note = input.reviewNote === undefined || input.reviewNote === null || input.reviewNote === ""
            ? null : requiredText(input.reviewNote, "reviewNote");
        if (status === AttendanceAdjustmentStatus.REJECTED && !note) {
            throw new AttendanceAdjustmentError("reviewNote is required", 400);
        }
        try {
            return await prisma.$transaction(async (tx) => {
                const request = await attendanceAdjustmentRepository.findById(id, tx);
                if (!request) throw new AttendanceAdjustmentError("Attendance adjustment not found", 404);
                const claimed = await tx.attendanceAdjustmentRequest.updateMany({
                    where: { id, status: AttendanceAdjustmentStatus.PENDING },
                    data: { status, reviewedBy: actor.userId, reviewedAt: new Date(), reviewNote: note },
                });
                if (claimed.count !== 1) {
                    throw new AttendanceAdjustmentError("Attendance adjustment already reviewed", 409);
                }
                let attendanceId = request.attendanceId;
                if (status === AttendanceAdjustmentStatus.APPROVED) {
                    const current = await attendanceAdjustmentRepository.findAttendance(request.employeeId, request.attendanceDate, tx);
                    if (request.originalUpdatedAt) {
                        if (!current || current.id !== request.attendanceId ||
                            current.updatedAt.getTime() !== request.originalUpdatedAt.getTime()) {
                            throw new AttendanceAdjustmentError("Attendance changed since request", 409);
                        }
                    } else if (current) {
                        throw new AttendanceAdjustmentError("Attendance changed since request", 409);
                    }
                    const checkInTime = request.requestedCheckInTime;
                    const checkOutTime = request.requestedCheckOutTime;
                    const statusValue = getAttendanceStatus(getCompanyDateContext(checkInTime).secondsSinceMidnight);
                    if (current) {
                        const updated = await tx.attendance.updateMany({
                            where: { id: current.id, updatedAt: current.updatedAt },
                            data: { checkInTime, checkOutTime, status: statusValue },
                        });
                        if (updated.count !== 1) throw new AttendanceAdjustmentError("Attendance changed since request", 409);
                        attendanceId = current.id;
                    } else {
                        const created = await tx.attendance.create({
                            data: { employeeId: request.employeeId, attendanceDate: request.attendanceDate,
                                checkInTime, checkOutTime, status: statusValue },
                        });
                        attendanceId = created.id;
                    }
                }
                return tx.attendanceAdjustmentRequest.update({
                    where: { id }, data: { attendanceId },
                    include: { employee: { select: { id: true, employeeCode: true, fullName: true } },
                        reviewer: { select: { id: true, fullName: true } },
                        attendance: { select: { id: true, checkInTime: true, checkOutTime: true, status: true } } },
                });
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === "P2002" || error.code === "P2034")) {
                throw new AttendanceAdjustmentError("Attendance changed since request", 409);
            }
            throw error;
        }
    },
};
