import type { CalendarException, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { affectedDates, civilDate } from "./calendar-date";
import { calendarExceptionRepository as repository } from "./calendar-exception.repository";
import type { CalendarExceptionDto, CalendarExceptionPayload } from "./calendar-exception.types";
import { calendarKeys, calendarObject, calendarText, expectedRevision, invalidCalendar, parseException,
    parseExceptionListQuery, parsePreviewQuery } from "./calendar-exception.validation";
import { analyzeCalendar, buildCalendarPreview } from "./calendar-preview.engine";
import { workScheduleRepository as schedules } from "./work-schedule.repository";
import { requireDraft, revisionConflict, toWorkScheduleDto, validateScheduleId, WorkScheduleError } from "./work-schedule.service";
import type { WorkScheduleDto } from "./work-schedule.types";
import { findHolidayPreset } from "./holiday-presets";

const exceptionNotFound = (): never => { throw new WorkScheduleError("WORK_CALENDAR_EXCEPTION_NOT_FOUND", "Không tìm thấy ngoại lệ lịch làm việc.", 404); };
const validateExceptionId = (id: string) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) exceptionNotFound();
};
export const toCalendarExceptionDto = (row: CalendarException): CalendarExceptionDto => ({
    id: row.id, scheduleVersionId: row.scheduleVersionId, payload: parseException(row.payload),
    firstAffectedDate: row.firstAffectedDate.toISOString().slice(0, 10), createdBy: row.createdBy, updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
});
export const eventData = (payload: CalendarExceptionPayload) => {
    const dates = affectedDates(payload);
    return { kind: payload.kind, payload: payload as Prisma.InputJsonObject,
        firstAffectedDate: civilDate(dates[0]), lastAffectedDate: civilDate(dates[dates.length - 1]) };
};
const conflict = (): never => { throw new WorkScheduleError("WORK_CALENDAR_EXCEPTION_CONFLICT", "Ngày đã có ngoại lệ khác. Vui lòng kiểm tra lại lịch.", 409); };
const referenced = (): never => { throw new WorkScheduleError("WORK_CALENDAR_EXCEPTION_REFERENCED", "Ngày lễ đang được liên kết với nghỉ bù. Vui lòng xử lý nghỉ bù trước.", 409); };

function assertNotReferenced(current: CalendarExceptionDto, events: CalendarExceptionDto[], replacement?: CalendarExceptionPayload) {
    const payload = current.payload;
    if (payload.kind !== "HOLIDAY" || (replacement?.kind === "HOLIDAY" && replacement.date === payload.date && replacement.holidayPolicy?.category !== "COMPANY")) return;
    if (events.some((e) => e.payload.kind === "COMPENSATORY_OFF" && e.payload.sourceHolidayDate === payload.date)) referenced();
}
export function validateEvent(schedule: WorkScheduleDto, candidate: CalendarExceptionDto, existing: CalendarExceptionDto[]) {
    const dates = affectedDates(candidate.payload);
    const policy = candidate.payload.kind === "HOLIDAY" ? candidate.payload.holidayPolicy : undefined;
    if (policy?.category === "STATUTORY") {
        const selected = findHolidayPreset(policy.presetId)!;
        const alternative = existing.some((e) => {
            const other = e.payload.kind === "HOLIDAY" && e.payload.holidayPolicy?.category === "STATUTORY"
                ? findHolidayPreset(e.payload.holidayPolicy.presetId) : undefined;
            return other && other.year === selected.year && other.holidayCode === selected.holidayCode && other.id !== selected.id;
        });
        if (alternative) invalidCalendar("exception.holidayPolicy.presetId", "Đã có phương án khác cho cùng kỳ nghỉ. Vui lòng xử lý phương án cũ trước khi đổi.");
    }
    if (existing.some((e) => affectedDates(e.payload).some((date) => dates.includes(date)))) conflict();
    const analysis = analyzeCalendar(schedule, [...existing, candidate]);
    const blockers = analysis.issues.filter((i) => i.exceptionIds.includes(candidate.id));
    const ownIssue = blockers.find((i) => i.code === "EXCEPTION_BEFORE_EFFECTIVE_FROM" || i.code === "SWAP_BASE_DAY_INVALID" ||
        i.code === "WORK_OVERRIDE_BASE_DAY_INVALID" || (candidate.payload.kind === "COMPENSATORY_OFF" &&
        ["COMPENSATORY_SOURCE_INVALID", "COMPENSATORY_SOURCE_DUPLICATED", "COMPENSATORY_DATE_INVALID"].includes(i.code)));
    if (ownIssue) {
        const field = candidate.payload.kind === "COMPENSATORY_OFF" && ["COMPENSATORY_SOURCE_INVALID", "COMPENSATORY_SOURCE_DUPLICATED"].includes(ownIssue.code)
            ? "sourceHolidayDate" : candidate.payload.kind === "SWAP" ? "workDate" : "date";
        invalidCalendar(`exception.${field}`, ownIssue.message);
    }
}

export const calendarExceptionService = {
    async list(versionId: string, query: Record<string, unknown>) {
        validateScheduleId(versionId);
        const { page, limit, kind, fromDate, toDate } = parseExceptionListQuery(query);
        return repository.snapshot(async (tx) => {
            const parent = requireDraft(await schedules.findById(versionId, tx));
            const range = fromDate && toDate ? { gte: civilDate(fromDate), lte: civilDate(toDate) } : undefined;
            const where: Prisma.CalendarExceptionWhereInput = { scheduleVersionId: versionId, ...(kind ? { kind } : {}),
                ...(range ? { OR: [{ firstAffectedDate: range }, { lastAffectedDate: range }] } : {}) };
            const result = await repository.page(where, (page - 1) * limit, limit, tx);
            const totalPages = Math.ceil(result.totalItems / limit);
            return { data: result.data.map(toCalendarExceptionDto), meta: { page, limit, totalItems: result.totalItems, totalPages,
                hasNextPage: page < totalPages, hasPreviousPage: page > 1 && totalPages > 0 }, scheduleRevision: parent.revision };
        });
    },
    async getById(versionId: string, id: string) {
        validateScheduleId(versionId);
        validateExceptionId(id);
        return repository.snapshot(async (tx) => {
            const parent = requireDraft(await schedules.findById(versionId, tx));
            const row = await repository.find(id, versionId, tx);
            if (!row) return exceptionNotFound();
            return { exception: toCalendarExceptionDto(row), scheduleRevision: parent.revision };
        });
    },
    async preview(query: Record<string, unknown>) {
        const { versionId, year, month } = parsePreviewQuery(query);
        validateScheduleId(versionId);
        return repository.snapshot(async (tx) => {
            const schedule = toWorkScheduleDto(requireDraft(await schedules.findById(versionId, tx)));
            const events = (await repository.all(versionId, tx)).map(toCalendarExceptionDto);
            return buildCalendarPreview(schedule, events, year, month);
        });
    },
    create(versionId: string, actorId: string, body: unknown) {
        return mutateException("EXCEPTION_CREATE", versionId, undefined, actorId, body);
    },
    replace(versionId: string, id: string, actorId: string, body: unknown) {
        return mutateException("EXCEPTION_UPDATE", versionId, id, actorId, body);
    },
    remove(versionId: string, id: string, actorId: string, body: unknown) {
        return mutateException("EXCEPTION_DELETE", versionId, id, actorId, body);
    },
};

function mutateException(action: "EXCEPTION_DELETE", versionId: string, id: string, actorId: string, body: unknown): Promise<{ removedExceptionId: string; scheduleRevision: number }>;
function mutateException(action: "EXCEPTION_CREATE" | "EXCEPTION_UPDATE", versionId: string, id: string | undefined, actorId: string, body: unknown): Promise<{ exception: CalendarExceptionDto; scheduleRevision: number }>;
function mutateException(action: "EXCEPTION_CREATE" | "EXCEPTION_UPDATE" | "EXCEPTION_DELETE", versionId: string, id: string | undefined, actorId: string, body: unknown) {
    validateScheduleId(versionId);
    if (id) validateExceptionId(id);
    const input = calendarObject(body);
    const deleting = action === "EXCEPTION_DELETE";
    calendarKeys(input, deleting ? ["expectedRevision", "reason"] : ["expectedRevision", "exception"]);
    const revision = expectedRevision(input.expectedRevision);
    let payload = deleting ? undefined : parseException(input.exception);
    const reason = deleting ? calendarText(input.reason, "reason") : payload!.reason;
    return prisma.$transaction(async (tx) => {
        const parent = requireDraft(await schedules.findById(versionId, tx));
        if (parent.revision !== revision) revisionConflict();
        // Acquire the shared parent CAS before reading children. All S1/S2A writers serialize here.
        const result = await schedules.updateDraft(versionId, revision, { revision: { increment: 1 }, updatedBy: actorId }, tx);
        if (result.count !== 1) revisionConflict();
        const events = (await repository.all(versionId, tx)).map(toCalendarExceptionDto);
        const current = id ? events.find((e) => e.id === id) : undefined;
        if (id && !current) return exceptionNotFound();
        if (current?.payload.kind === "HOLIDAY" && current.payload.holidayPolicy && payload?.kind === "HOLIDAY" && !payload.holidayPolicy) {
            payload = parseException({ ...payload, holidayPolicy: current.payload.holidayPolicy });
        }
        if (current) assertNotReferenced(current, events, payload);
        const scheduleRevision = revision + 1;
        if (deleting) {
            await repository.remove(id!, tx);
            await schedules.audit({ scheduleVersionId: versionId, action, actorId,
                before: { exception: current!, scheduleRevision: revision },
                after: { removedExceptionId: id!, scheduleRevision, reason } }, tx);
            return { removedExceptionId: id!, scheduleRevision };
        }
        const data = eventData(payload!);
        const candidate: CalendarExceptionDto = { id: id ?? "candidate", scheduleVersionId: versionId, payload: payload!,
            firstAffectedDate: data.firstAffectedDate.toISOString().slice(0, 10), createdBy: current?.createdBy ?? actorId,
            updatedBy: actorId, createdAt: current?.createdAt ?? parent.createdAt.toISOString(), updatedAt: parent.updatedAt.toISOString() };
        validateEvent(toWorkScheduleDto(parent), candidate, events.filter((e) => e.id !== id));
        const saved = id ? await repository.replace(id, { ...data, updatedBy: actorId }, tx)
            : await repository.create({ ...data, scheduleVersionId: versionId, createdBy: actorId, updatedBy: actorId }, tx);
        const response = { exception: toCalendarExceptionDto(saved), scheduleRevision };
        await schedules.audit({ scheduleVersionId: versionId, action, actorId,
            ...(current ? { before: { exception: current, scheduleRevision: revision } } : {}), after: response }, tx);
        return response;
    });
}
