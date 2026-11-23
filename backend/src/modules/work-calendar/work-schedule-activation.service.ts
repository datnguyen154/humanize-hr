import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { toCalendarExceptionDto } from "./calendar-exception.service";
import type { CalendarExceptionDto } from "./calendar-exception.types";
import { analyzeCalendar } from "./calendar-preview.engine";
import { workScheduleRepository as repository } from "./work-schedule.repository";
import { requireDraft, revisionConflict, toWorkScheduleDto, validateScheduleId, WorkScheduleError } from "./work-schedule.service";
import type { WorkScheduleDto } from "./work-schedule.types";

const companyToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });
const displayDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;

/** Civil date (YYYY-MM-DD) of tomorrow in the company timezone. */
export function companyTomorrow(now = new Date()): string {
    const today = new Date(`${companyToday.format(now)}T00:00:00.000Z`);
    today.setUTCDate(today.getUTCDate() + 1);
    return today.toISOString().slice(0, 10);
}

/**
 * Pure activation rules: no retroactive start, strictly after the latest ACTIVE version, and no
 * blocking calendar issue (e.g. a holiday on a weekly off still waiting for its compensatory day).
 */
export function assertActivatable(schedule: WorkScheduleDto, events: CalendarExceptionDto[], latestActiveFrom: string | null, tomorrow: string) {
    if (schedule.effectiveFrom < tomorrow) {
        throw new WorkScheduleError("WORK_SCHEDULE_EFFECTIVE_FROM_TOO_EARLY",
            `Ngày hiệu lực phải từ ${displayDate(tomorrow)} trở đi, lịch không được áp dụng hồi tố.`, 409);
    }
    if (latestActiveFrom && schedule.effectiveFrom <= latestActiveFrom) {
        throw new WorkScheduleError("WORK_SCHEDULE_EFFECTIVE_FROM_OVERLAP",
            `Ngày hiệu lực phải sau ngày ${displayDate(latestActiveFrom)} của lịch đang áp dụng gần nhất.`, 409);
    }
    const blocker = analyzeCalendar(schedule, events).issues.find((issue) => issue.severity === "BLOCKER");
    if (blocker) {
        throw new WorkScheduleError("WORK_SCHEDULE_CALENDAR_BLOCKED",
            `Lịch còn vấn đề cần xử lý trước khi kích hoạt: ${blocker.message}`, 409);
    }
}

const parseRevision = (body: unknown): number => {
    const input = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
    const extra = Object.keys(input).find((key) => key !== "expectedRevision");
    const revision = input.expectedRevision;
    if (extra || typeof revision !== "number" || !Number.isInteger(revision) || revision < 1 || revision >= 2147483647) {
        throw new WorkScheduleError("VALIDATION_ERROR", "Thông tin kích hoạt không hợp lệ.", 400,
            { [extra ?? "expectedRevision"]: extra ? "Trường dữ liệu không được hỗ trợ." : "Phiên bản kiểm tra phải là số nguyên dương hợp lệ." });
    }
    return revision;
};

export const workScheduleActivationService = {
    async activate(id: string, actorId: string, body: unknown): Promise<WorkScheduleDto> {
        validateScheduleId(id);
        const revision = parseRevision(body);
        try {
            // Serializable so two concurrent activations cannot both pass the "after latest ACTIVE" check.
            return await prisma.$transaction(async (tx) => {
                const current = requireDraft(await repository.findById(id, tx));
                if (current.revision !== revision) revisionConflict();
                const before = toWorkScheduleDto(current);
                const events = (await tx.calendarException.findMany({ where: { scheduleVersionId: id } })).map(toCalendarExceptionDto);
                const latest = await tx.workScheduleVersion.findFirst({ where: { status: "ACTIVE" }, orderBy: { effectiveFrom: "desc" } });
                assertActivatable(before, events, latest ? latest.effectiveFrom.toISOString().slice(0, 10) : null, companyTomorrow());
                const updated = await repository.updateDraft(id, revision, {
                    status: "ACTIVE", updatedBy: actorId, revision: { increment: 1 },
                }, tx);
                if (updated.count !== 1) revisionConflict();
                const result = toWorkScheduleDto((await repository.findById(id, tx))!);
                await repository.audit({ scheduleVersionId: id, action: "ACTIVATE", actorId, before, after: result }, tx);
                return result;
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") revisionConflict();
            throw error;
        }
    },
};
