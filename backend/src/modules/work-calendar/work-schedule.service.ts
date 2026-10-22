import type { WorkScheduleVersion } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { workScheduleRepository as repository } from "./work-schedule.repository";
import type { WorkScheduleConfig, WorkScheduleDto } from "./work-schedule.types";

export class WorkScheduleError extends Error {
    constructor(public readonly code: string, message: string, public readonly statusCode: number,
        public readonly details?: Record<string, string>) {
        super(message);
        this.name = "WorkScheduleError";
    }
}

const configKeys = ["effectiveFrom", "timezone", "weekdays", "startTime", "endTime", "breaks"];
const invalid = (field: string, message: string): never => {
    throw new WorkScheduleError("VALIDATION_ERROR", "Thông tin lịch làm việc không hợp lệ.", 400, { [field]: message });
};
const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return invalid("body", "Dữ liệu phải là một đối tượng.");
    return value as Record<string, unknown>;
};
const allowKeys = (value: Record<string, unknown>, keys: string[]) => {
    for (const key of Object.keys(value)) {
        if (!keys.includes(key)) invalid(key, "Trường dữ liệu không được hỗ trợ.");
    }
};
const date = (value: unknown): Date => {
    if (typeof value !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith("0000")) {
        return invalid("effectiveFrom", "Ngày hiệu lực phải có định dạng YYYY-MM-DD.");
    }
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        return invalid("effectiveFrom", "Ngày hiệu lực không tồn tại.");
    }
    return parsed;
};
const minute = (value: unknown, field: string): number => {
    if (typeof value !== "string" || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return invalid(field, "Giờ phải có định dạng HH:mm từ 00:00 đến 23:59.");
    }
    return Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
};
const time = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const validateConfig = (input: Record<string, unknown>) => {
    const effectiveFrom = date(input.effectiveFrom);
    if (input.timezone !== "Asia/Ho_Chi_Minh") invalid("timezone", "Múi giờ phải là Asia/Ho_Chi_Minh.");
    const weekdays = input.weekdays;
    if (!Array.isArray(weekdays) || weekdays.length < 1 || weekdays.length > 7 ||
        weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7) || new Set(weekdays).size !== weekdays.length) {
        return invalid("weekdays", "Chọn từ 1 đến 7 ngày ISO không trùng nhau (1 là Thứ Hai, 7 là Chủ Nhật).");
    }
    const startMinute = minute(input.startTime, "startTime");
    const endMinute = minute(input.endTime, "endTime");
    if (!Array.isArray(input.breaks) || input.breaks.length !== 1) return invalid("breaks", "Lịch phải có đúng một khoảng nghỉ giữa ca.");
    const interval = object(input.breaks[0]);
    allowKeys(interval, ["startTime", "endTime"]);
    const breakStartMinute = minute(interval.startTime, "breaks.0.startTime");
    const breakEndMinute = minute(interval.endTime, "breaks.0.endTime");
    if (!(startMinute < breakStartMinute && breakStartMinute < breakEndMinute && breakEndMinute < endMinute)) {
        return invalid("breaks", "Khoảng nghỉ phải nằm giữa giờ vào và giờ ra; ca không được qua ngày.");
    }
    return { effectiveFrom, timezone: "Asia/Ho_Chi_Minh", weekdays: [...weekdays].sort((a, b) => a - b),
        startMinute, endMinute, breakStartMinute, breakEndMinute };
};
const dto = (row: WorkScheduleVersion): WorkScheduleDto => ({
    id: row.id, version: row.version, revision: row.revision, status: row.status,
    effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10), timezone: row.timezone as WorkScheduleConfig["timezone"],
    weekdays: row.weekdays, startTime: time(row.startMinute), endTime: time(row.endMinute),
    breaks: [{ startTime: time(row.breakStartMinute), endTime: time(row.breakEndMinute) }],
    createdBy: row.createdBy, updatedBy: row.updatedBy, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
});
const notFound = (): never => { throw new WorkScheduleError("WORK_SCHEDULE_NOT_FOUND", "Không tìm thấy bản nháp lịch làm việc.", 404); };
const validateId = (id: string) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();
};
const draft = (row: WorkScheduleVersion | null): WorkScheduleVersion => {
    if (!row) return notFound();
    if (row.status !== "DRAFT") throw new WorkScheduleError("WORK_SCHEDULE_NOT_DRAFT", "Chỉ được thao tác với bản nháp lịch làm việc.", 409);
    return row;
};
const stale = (): never => { throw new WorkScheduleError("WORK_SCHEDULE_REVISION_CONFLICT", "Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu.", 409); };
const positiveQueryInt = (value: unknown, fallback: number, max: number, field: string) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
        return invalid(field, "Giá trị phân trang không hợp lệ.");
    }
    return Number(value);
};

export const workScheduleService = {
    async list(query: Record<string, unknown>) {
        allowKeys(query, ["page", "limit"]);
        const page = positiveQueryInt(query.page, 1, 1000000, "page");
        const limit = positiveQueryInt(query.limit, 10, 100, "limit");
        const result = await repository.list((page - 1) * limit, limit);
        const totalPages = Math.ceil(result.totalItems / limit);
        return { data: result.data.map(dto), meta: { page, limit, totalItems: result.totalItems, totalPages,
            hasNextPage: page < totalPages, hasPreviousPage: page > 1 && totalPages > 0 } };
    },
    async getById(id: string) {
        validateId(id);
        return dto(draft(await repository.findById(id)));
    },
    async create(actorId: string, body: unknown) {
        const input = object(body);
        allowKeys(input, configKeys);
        const config = validateConfig(input);
        return prisma.$transaction(async (tx) => {
            const row = await repository.create({ ...config, status: "DRAFT", createdBy: actorId, updatedBy: actorId }, tx);
            const result = dto(row);
            await repository.audit({ scheduleVersionId: row.id, action: "CREATE", actorId, after: result }, tx);
            return result;
        });
    },
    async update(id: string, actorId: string, body: unknown) {
        validateId(id);
        const input = object(body);
        allowKeys(input, [...configKeys, "expectedRevision"]);
        const revision = input.expectedRevision;
        if (typeof revision !== "number" || !Number.isInteger(revision) || revision < 1 || revision >= 2147483647) {
            return invalid("expectedRevision", "Phiên bản kiểm tra phải là số nguyên dương hợp lệ.");
        }
        if (!configKeys.some((key) => Object.hasOwn(input, key))) return invalid("body", "Vui lòng gửi ít nhất một trường cần sửa.");
        return prisma.$transaction(async (tx) => {
            const current = draft(await repository.findById(id, tx));
            if (current.revision !== revision) stale();
            const before = dto(current);
            const config = validateConfig({ ...before, ...input });
            // The write itself must guard revision/status, not just the preceding read.
            const updated = await repository.updateDraft(id, revision, {
                ...config, updatedBy: actorId, revision: { increment: 1 },
            }, tx);
            if (updated.count !== 1) stale();
            const result = dto(draft(await repository.findById(id, tx)));
            await repository.audit({ scheduleVersionId: id, action: "UPDATE", actorId, before, after: result }, tx);
            return result;
        });
    },
};
