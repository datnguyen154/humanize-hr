import { prisma } from "../../config/prisma";
import { affectedDates, civilDayNumber, nextCivilDate } from "./calendar-date";
import { calendarExceptionRepository as repository } from "./calendar-exception.repository";
import { eventData, toCalendarExceptionDto, validateEvent } from "./calendar-exception.service";
import type { CalendarExceptionDto, CalendarExceptionPayload } from "./calendar-exception.types";
import { calendarKeys, calendarObject, expectedRevision, invalidCalendar, parseException } from "./calendar-exception.validation";
import { analyzeCalendar, buildCalendarPreview, calendarFingerprint } from "./calendar-preview.engine";
import { HOLIDAY_CATALOG_VERSION } from "./holiday-presets";
import { workScheduleRepository as schedules } from "./work-schedule.repository";
import { requireDraft, revisionConflict, toWorkScheduleDto, validateScheduleId, WorkScheduleError } from "./work-schedule.service";
import type { WorkScheduleDto } from "./work-schedule.types";

type Holiday = Extract<CalendarExceptionPayload, { kind: "HOLIDAY" }>;
type BatchInput = { expectedRevision: number; holidays: Holiday[]; includeCompensatoryOff: boolean; planFingerprint?: string };

export function parseHolidayBatch(body: unknown, committing = false): BatchInput {
    const input = calendarObject(body);
    calendarKeys(input, committing ? ["expectedRevision", "holidays", "includeCompensatoryOff", "planFingerprint"] : ["expectedRevision", "holidays", "includeCompensatoryOff"]);
    const revision = expectedRevision(input.expectedRevision);
    if (!Array.isArray(input.holidays) || input.holidays.length < 1 || input.holidays.length > 31) return invalidCalendar("holidays", "Mỗi thao tác cần từ 1 đến 31 ngày lễ/nghỉ doanh nghiệp.");
    const holidays = input.holidays.map((value, index): Holiday => {
        try {
            const payload = parseException(value);
            if (payload.kind !== "HOLIDAY" || !payload.holidayPolicy) return invalidCalendar(`holidays.${index}`, "Vui lòng phân loại ngày lễ pháp định hoặc ngày nghỉ doanh nghiệp.");
            return payload;
        } catch (error) {
            if (error instanceof WorkScheduleError && error.details) {
                throw new WorkScheduleError(error.code, error.message, error.statusCode, Object.fromEntries(
                    Object.entries(error.details).map(([field, message]) => [field.replace(/^exception(?=\.|$)/, `holidays.${index}`), message])));
            }
            throw error;
        }
    }).sort((a, b) => a.date.localeCompare(b.date));
    if (new Set(holidays.map((h) => h.date)).size !== holidays.length) return invalidCalendar("holidays", "Danh sách có ngày trùng nhau.");
    if (civilDayNumber(holidays[holidays.length - 1].date) - civilDayNumber(holidays[0].date) > 365) return invalidCalendar("holidays", "Khoảng ngày không vượt quá 366 ngày.");
    if (typeof input.includeCompensatoryOff !== "boolean") return invalidCalendar("includeCompensatoryOff", "Vui lòng xác nhận có đề xuất nghỉ bù hay không.");
    if (committing && (typeof input.planFingerprint !== "string" || !/^sha256:[a-f0-9]{64}$/.test(input.planFingerprint))) return invalidCalendar("planFingerprint", "Vui lòng xem trước và xác nhận kế hoạch trước khi lưu.");
    return { expectedRevision: revision, holidays, includeCompensatoryOff: input.includeCompensatoryOff,
        ...(committing ? { planFingerprint: input.planFingerprint as string } : {}) };
}

const synthetic = (schedule: WorkScheduleDto, payload: CalendarExceptionPayload): CalendarExceptionDto => ({
    id: `batch:${payload.kind}:${affectedDates(payload)[0]}`, scheduleVersionId: schedule.id, payload,
    firstAffectedDate: affectedDates(payload)[0], createdBy: schedule.updatedBy, updatedBy: schedule.updatedBy,
    createdAt: schedule.updatedAt, updatedAt: schedule.updatedAt,
});
const collision = (): never => { throw new WorkScheduleError("WORK_CALENDAR_EXCEPTION_CONFLICT", "Ngày đã có cấu hình khác. Không ghi đè hoặc lưu một phần kỳ nghỉ.", 409); };

export function planHolidayBatch(schedule: WorkScheduleDto, events: CalendarExceptionDto[], input: BatchInput) {
    if (schedule.revision !== input.expectedRevision) revisionConflict();
    const proposed: CalendarExceptionDto[] = [];
    const skipped: { exceptionId: string; date: string; kind: "HOLIDAY" | "COMPENSATORY_OFF" }[] = [];
    for (const holiday of input.holidays) {
        const existing = events.find((event) => affectedDates(event.payload).includes(holiday.date));
        if (existing) {
            const p = existing.payload;
            if (p.kind !== "HOLIDAY" || p.name !== holiday.name || p.sourceReference !== holiday.sourceReference || p.reason !== holiday.reason ||
                JSON.stringify(p.holidayPolicy) !== JSON.stringify(holiday.holidayPolicy)) collision();
            skipped.push({ exceptionId: existing.id, date: holiday.date, kind: "HOLIDAY" });
        } else proposed.push(synthetic(schedule, holiday));
    }
    const holidaysProjection = [...events, ...proposed];
    for (const candidate of proposed) validateEvent(schedule, candidate, holidaysProjection.filter((e) => e.id !== candidate.id));
    const analysis = analyzeCalendar(schedule, holidaysProjection);
    const reviewDates = input.holidays.map((holiday) => holiday.date);
    if (input.includeCompensatoryOff) {
        for (const holiday of input.holidays.filter((h) => h.holidayPolicy?.category === "STATUTORY")) {
            const source = holidaysProjection.find((e) => e.payload.kind === "HOLIDAY" && e.payload.date === holiday.date)!;
            if (!analysis.targets.has(source.id)) continue; // A holiday on a workday has no weekly-rest compensation.
            const target = analysis.targets.get(source.id);
            if (!target) throw new WorkScheduleError("WORK_CALENDAR_BATCH_UNRESOLVED", "Chưa xác định được ngày nghỉ bù. Vui lòng xử lý các cảnh báo lịch trước.", 409);
            reviewDates.push(target);
            const linked = events.filter((e) => e.payload.kind === "COMPENSATORY_OFF" && e.payload.sourceHolidayDate === holiday.date);
            if (linked.length > 1 || (linked[0] && (linked[0].payload.kind !== "COMPENSATORY_OFF" || linked[0].payload.date !== target))) collision();
            if (linked[0]) {
                skipped.push({ exceptionId: linked[0].id, date: target, kind: "COMPENSATORY_OFF" });
            } else {
                proposed.push(synthetic(schedule, { kind: "COMPENSATORY_OFF", date: target, sourceHolidayDate: holiday.date,
                    reason: `Nghỉ bù ngày nghỉ tuần trùng ${holiday.name} (${holiday.date}), HR xác nhận theo khoản 3 Điều 111 Bộ luật Lao động.` }));
            }
        }
    }
    const projection = [...events, ...proposed];
    for (const candidate of proposed) validateEvent(schedule, candidate, projection.filter((e) => e.id !== candidate.id));
    reviewDates.sort();
    const from = reviewDates[0], to = reviewDates[reviewDates.length - 1];
    if (civilDayNumber(to) - civilDayNumber(from) > 365) return invalidCalendar("holidays", "Khoảng xem trước gồm nghỉ bù không vượt quá 366 ngày.");
    const previewByMonth = new Map<string, ReturnType<typeof buildCalendarPreview>>();
    const calendarDays = [];
    for (let cursor: string | null = from; cursor && cursor <= to; cursor = nextCivilDate(cursor)) {
        const key = cursor.slice(0, 7);
        if (!previewByMonth.has(key)) previewByMonth.set(key, buildCalendarPreview(schedule, projection, Number(cursor.slice(0, 4)), Number(cursor.slice(5, 7))));
        calendarDays.push(previewByMonth.get(key)!.days.find((day) => day.date === cursor)!);
    }
    const validation = analyzeCalendar(schedule, projection);
    const toCreate = proposed.map((e) => e.payload);
    return { scheduleRevision: schedule.revision, catalogVersion: HOLIDAY_CATALOG_VERSION,
        planFingerprint: calendarFingerprint(schedule, projection), toCreate, skipped, calendarDays,
        validation: { hasBlockingIssues: validation.issues.length > 0, issues: validation.issues } };
}

export const calendarHolidayBatchService = {
    async preview(versionId: string, body: unknown) {
        validateScheduleId(versionId);
        const input = parseHolidayBatch(body);
        return repository.snapshot(async (tx) => {
            const schedule = toWorkScheduleDto(requireDraft(await schedules.findById(versionId, tx)));
            return planHolidayBatch(schedule, (await repository.all(versionId, tx)).map(toCalendarExceptionDto), input);
        });
    },
    async create(versionId: string, actorId: string, body: unknown) {
        validateScheduleId(versionId);
        const input = parseHolidayBatch(body, true);
        return prisma.$transaction(async (tx) => {
            const parent = requireDraft(await schedules.findById(versionId, tx));
            if (parent.revision !== input.expectedRevision) revisionConflict();
            // Serialize with all S1/S2A writers, including an idempotent all-skipped batch.
            const locked = await schedules.updateDraft(versionId, input.expectedRevision, { revision: input.expectedRevision, updatedAt: parent.updatedAt }, tx);
            if (locked.count !== 1) revisionConflict();
            const plan = planHolidayBatch(toWorkScheduleDto(parent), (await repository.all(versionId, tx)).map(toCalendarExceptionDto), input);
            if (plan.planFingerprint !== input.planFingerprint) throw new WorkScheduleError("WORK_CALENDAR_BATCH_PLAN_CHANGED", "Kế hoạch đã thay đổi. Vui lòng xem trước và xác nhận lại.", 409);
            if (!plan.toCreate.length) return { created: [], skipped: plan.skipped, scheduleRevision: parent.revision };
            const result = await schedules.updateDraft(versionId, parent.revision, { revision: { increment: 1 }, updatedBy: actorId }, tx);
            if (result.count !== 1) revisionConflict();
            const created: CalendarExceptionDto[] = [];
            for (const payload of plan.toCreate) created.push(toCalendarExceptionDto(await repository.create({ ...eventData(payload),
                scheduleVersionId: versionId, createdBy: actorId, updatedBy: actorId }, tx)));
            const response = { created, skipped: plan.skipped, scheduleRevision: parent.revision + 1 };
            await schedules.audit({ scheduleVersionId: versionId, actorId, action: "EXCEPTION_CREATE",
                before: { scheduleRevision: parent.revision }, after: { ...response, operation: "HOLIDAY_BATCH", planFingerprint: plan.planFingerprint } }, tx);
            return response;
        }, { timeout: 15000 });
    },
};
