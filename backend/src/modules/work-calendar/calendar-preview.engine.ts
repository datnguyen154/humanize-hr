import { createHash } from "node:crypto";
import { affectedDates, isoWeekday, monthDates, nextCivilDate, timeMinutes } from "./calendar-date";
import type { CalendarExceptionDto, CalendarIssue, CalendarPreviewDay, CalendarPreviewDto, CalendarShift } from "./calendar-exception.types";
import type { WorkScheduleDto } from "./work-schedule.types";

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export const baseWorkday = (schedule: WorkScheduleDto, date: string): boolean => schedule.weekdays.includes(isoWeekday(date));

export function analyzeCalendar(schedule: WorkScheduleDto, events: CalendarExceptionDto[]) {
    const issues: CalendarIssue[] = [];
    const occupied = new Map<string, CalendarExceptionDto[]>();
    const unresolved = new Map<string, Set<string>>();
    const issue = (code: CalendarIssue["code"], date: string | null, ids: string[], message: string, dates: string[] = []) => {
        const exceptionIds = [...new Set(ids)].sort();
        issues.push({ code, severity: "BLOCKER", scope: "DRAFT", date, exceptionIds, message });
        for (const day of dates) {
            const existing = unresolved.get(day) ?? new Set<string>();
            exceptionIds.forEach((id) => existing.add(id));
            unresolved.set(day, existing);
        }
    };
    const sorted = [...events].sort((a, b) => compare(a.firstAffectedDate, b.firstAffectedDate) || compare(a.id, b.id));
    for (const event of sorted) {
        const dates = affectedDates(event.payload);
        for (const date of new Set(dates)) occupied.set(date, [...(occupied.get(date) ?? []), event]);
        if (dates.some((date) => date < schedule.effectiveFrom)) {
            issue("EXCEPTION_BEFORE_EFFECTIVE_FROM", dates[0], [event.id], "Ngoại lệ nằm trước ngày hiệu lực của lịch. Vui lòng sửa hoặc xóa ngoại lệ.", dates);
        }
        if (event.payload.kind === "SWAP" && (event.payload.offDate === event.payload.workDate ||
            !baseWorkday(schedule, event.payload.offDate) || baseWorkday(schedule, event.payload.workDate))) {
            issue("SWAP_BASE_DAY_INVALID", event.payload.offDate, [event.id], "Cặp hoán đổi không còn phù hợp với ngày làm/nghỉ tuần của lịch nền.", dates);
        }
        if (event.payload.kind === "WORK_OVERRIDE" && !baseWorkday(schedule, event.payload.date)) {
            issue("WORK_OVERRIDE_BASE_DAY_INVALID", event.payload.date, [event.id], "Ngày đổi giờ phải là ngày làm việc theo lịch nền.", dates);
        }
    }
    for (const [date, entries] of occupied) {
        if (entries.length > 1) issue("EXCEPTION_DATE_CONFLICT", date, entries.map((e) => e.id),
            "Ngày có nhiều ngoại lệ xung đột. Vui lòng kiểm tra lại.", entries.flatMap((e) => affectedDates(e.payload)));
    }

    // Reserve targets from holiday sources, never from the order in which HR entered compensation events.
    const sourceHolidays = sorted.filter((e) => e.payload.kind === "HOLIDAY" && e.payload.holidayPolicy?.category !== "COMPANY" && e.payload.date >= schedule.effectiveFrom &&
        !baseWorkday(schedule, e.payload.date) && !unresolved.has(e.payload.date));
    const compensation = sorted.filter((e) => e.payload.kind === "COMPENSATORY_OFF");
    const targets = new Map<string, string | null>();
    const reserved = new Set<string>();
    let allocationBlocked = false;
    for (const source of sourceHolidays) {
        if (source.payload.kind !== "HOLIDAY") continue;
        let cursor = nextCivilDate(source.payload.date);
        let target: string | null = null;
        while (cursor && !allocationBlocked) {
            if (unresolved.has(cursor)) break;
            const event = occupied.get(cursor)?.find((e) => e.payload.kind !== "COMPENSATORY_OFF");
            const payload = event?.payload;
            let working = baseWorkday(schedule, cursor);
            if (payload?.kind === "HOLIDAY") working = false;
            if (payload?.kind === "SWAP") working = cursor === payload.workDate;
            if (working && !reserved.has(cursor)) { target = cursor; break; }
            cursor = nextCivilDate(cursor);
        }
        targets.set(source.id, target);
        if (target) reserved.add(target);
        else {
            // Later sources cannot claim a date whose allocation to an earlier source is still unknown.
            allocationBlocked = true;
            issue("COMPENSATORY_TARGET_UNRESOLVED", cursor, [source.id], "Chưa xác định được ngày nghỉ bù hợp lệ từ nguồn lịch hiện tại.");
        }
    }
    const validSourceDates = new Map(sourceHolidays.map((e) => [e.firstAffectedDate, e]));
    for (const event of compensation) {
        const payload = event.payload;
        if (payload.kind !== "COMPENSATORY_OFF") continue;
        if (!validSourceDates.has(payload.sourceHolidayDate)) {
            issue("COMPENSATORY_SOURCE_INVALID", payload.date, [event.id], "Nguồn nghỉ bù phải là ngày lễ trùng nghỉ tuần hợp lệ trong cùng bản nháp.", [payload.date]);
        }
    }
    for (const source of sourceHolidays) {
        if (source.payload.kind !== "HOLIDAY") continue;
        const sourceDate = source.payload.date;
        const linked = compensation.filter((e) => e.payload.kind === "COMPENSATORY_OFF" && e.payload.sourceHolidayDate === sourceDate);
        const target = targets.get(source.id) ?? null;
        if (linked.length > 1) issue("COMPENSATORY_SOURCE_DUPLICATED", source.payload.date, linked.map((e) => e.id),
            "Một ngày lễ chỉ được liên kết với một ngày nghỉ bù.", [...linked.flatMap((e) => affectedDates(e.payload)), ...(target ? [target] : [])]);
        if (linked.length === 0 && target) issue("COMPENSATORY_OFF_REQUIRED", target, [source.id],
            "Ngày lễ trùng nghỉ tuần cần được quản trị viên xác nhận ngày nghỉ bù.", [target]);
        for (const event of linked) {
            if (event.payload.kind !== "COMPENSATORY_OFF") continue;
            if (event.payload.date !== target) issue("COMPENSATORY_DATE_INVALID", event.payload.date, [source.id, event.id],
                "Ngày nghỉ bù không phải ngày làm hợp lệ kế tiếp dành cho nguồn lễ này.", [event.payload.date, ...(target ? [target] : [])]);
        }
    }
    return { issues, occupied, unresolved, targets };
}

function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => compare(a, b)).map(([k, v]) => [k, canonical(v)]));
    return value;
}
export function calendarFingerprint(schedule: WorkScheduleDto, events: CalendarExceptionDto[]): string {
    const source = { resolverVersion: 2, id: schedule.id, revision: schedule.revision, effectiveFrom: schedule.effectiveFrom,
        timezone: schedule.timezone, weekdays: [...schedule.weekdays].sort(), startTime: schedule.startTime,
        endTime: schedule.endTime, breaks: schedule.breaks,
        events: events.map((e) => ({ id: e.id, payload: e.payload })).sort((a, b) => compare(a.id, b.id)) };
    return `sha256:${createHash("sha256").update(JSON.stringify(canonical(source))).digest("hex")}`;
}

export function buildCalendarPreview(schedule: WorkScheduleDto, events: CalendarExceptionDto[], year: number, month: number): CalendarPreviewDto {
    const analysis = analyzeCalendar(schedule, events);
    const issues = [...analysis.issues];
    const baseShift: CalendarShift = { startTime: schedule.startTime, endTime: schedule.endTime, breaks: schedule.breaks };
    const days = monthDates(year, month).map((date): CalendarPreviewDay => {
        const weekday = isoWeekday(date);
        if (date < schedule.effectiveFrom) {
            issues.push({ code: "NO_SCHEDULE", severity: "WARNING", scope: "MONTH", date, exceptionIds: [], message: "Ngày nằm trước hiệu lực của bản nháp, chưa có nguồn lịch trong preview này." });
            return { date, weekday, dayType: "NO_SCHEDULE", isBaseWeeklyOff: null, isWorkingDay: null,
                shift: null, requiredWorkingMinutes: null, scheduleVersionId: null, exceptionIds: [], holidayCategory: null, holidayPayPolicy: null };
        }
        const working = baseWorkday(schedule, date);
        const entries = analysis.occupied.get(date) ?? [];
        const invalid = analysis.unresolved.get(date);
        const exceptionIds = [...new Set([...entries.map((e) => e.id), ...(invalid ?? [])])].sort();
        if (invalid) return { date, weekday, dayType: "UNRESOLVED", isBaseWeeklyOff: !working, isWorkingDay: null,
            shift: null, requiredWorkingMinutes: null, scheduleVersionId: schedule.id, exceptionIds, holidayCategory: null, holidayPayPolicy: null };
        let isWorkingDay = working;
        let dayType: CalendarPreviewDay["dayType"] = working ? "WORKDAY" : "WEEKLY_OFF";
        let shift = baseShift;
        const payload = entries[0]?.payload;
        if (payload?.kind === "HOLIDAY" || payload?.kind === "COMPENSATORY_OFF") {
            isWorkingDay = false;
            dayType = payload.kind;
        } else if (payload?.kind === "SWAP") {
            isWorkingDay = date === payload.workDate;
            dayType = isWorkingDay ? "SWAPPED_WORKDAY" : "SWAPPED_OFF";
        } else if (payload?.kind === "WORK_OVERRIDE") {
            shift = { startTime: payload.startTime, endTime: payload.endTime, breaks: payload.breaks };
        }
        const requiredWorkingMinutes = isWorkingDay ? timeMinutes(shift.endTime) - timeMinutes(shift.startTime) -
            (timeMinutes(shift.breaks[0].endTime) - timeMinutes(shift.breaks[0].startTime)) : 0;
        return { date, weekday, dayType, isBaseWeeklyOff: !working, isWorkingDay, shift: isWorkingDay ? shift : null,
            requiredWorkingMinutes, scheduleVersionId: schedule.id, exceptionIds,
            holidayCategory: payload?.kind === "HOLIDAY" ? payload.holidayPolicy?.category ?? "UNCLASSIFIED" : null,
            holidayPayPolicy: payload?.kind !== "HOLIDAY" ? null : payload.holidayPolicy?.category === "STATUTORY" ? "PAID" :
                payload.holidayPolicy?.category === "COMPANY" ? (payload.holidayPolicy.isPaid ? "PAID" : "UNPAID") : "UNSPECIFIED" };
    });
    const missingScheduleDays = days.filter((d) => d.dayType === "NO_SCHEDULE").length;
    const unresolvedDays = days.filter((d) => d.dayType === "UNRESOLVED").length;
    const resolvedDays = days.length - missingScheduleDays - unresolvedDays;
    const partialRequiredWorkingDays = days.filter((d) => d.isWorkingDay === true).length;
    const partialRequiredWorkingMinutes = days.reduce((sum, d) => sum + (d.requiredWorkingMinutes ?? 0), 0);
    const isComplete = missingScheduleDays === 0 && unresolvedDays === 0;
    issues.sort((a, b) => compare(a.scope, b.scope) || compare(a.date ?? "", b.date ?? "") || compare(a.code, b.code) || compare(a.exceptionIds.join(","), b.exceptionIds.join(",")));
    return { mode: "DRAFT_PROJECTION", versionId: schedule.id, scheduleRevision: schedule.revision, effectiveFrom: schedule.effectiveFrom,
        timezone: schedule.timezone, year, month, sourceFingerprint: calendarFingerprint(schedule, events), days,
        summary: { totalDays: days.length, resolvedDays, missingScheduleDays, unresolvedDays, isComplete,
            requiredWorkingDays: isComplete ? partialRequiredWorkingDays : null,
            requiredWorkingMinutes: isComplete ? partialRequiredWorkingMinutes : null, partialRequiredWorkingDays, partialRequiredWorkingMinutes },
        validation: { hasBlockingIssues: issues.some((i) => i.severity === "BLOCKER"), issues } };
}
