import { WorkScheduleError } from "./work-schedule.service";
import { civilDate, civilDayNumber, timeMinutes } from "./calendar-date";
import type { CalendarExceptionPayload, HolidayPolicy } from "./calendar-exception.types";
import { findHolidayPreset } from "./holiday-presets";

export const exceptionKinds = ["HOLIDAY", "COMPENSATORY_OFF", "SWAP", "WORK_OVERRIDE"] as const;
export const invalidCalendar = (field: string, message: string): never => {
    throw new WorkScheduleError("VALIDATION_ERROR", "Thông tin ngoại lệ lịch làm việc không hợp lệ.", 400, { [field]: message });
};
export function calendarObject(value: unknown, field = "body"): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return invalidCalendar(field, "Dữ liệu phải là một đối tượng.");
    return value as Record<string, unknown>;
}
export function calendarKeys(input: Record<string, unknown>, keys: readonly string[], prefix = "") {
    for (const key of Object.keys(input)) {
        if (!keys.includes(key)) invalidCalendar(`${prefix}${key}`, "Trường dữ liệu không được hỗ trợ.");
    }
}
export function calendarDate(value: unknown, field: string): string {
    if (typeof value !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith("0000")) {
        return invalidCalendar(field, "Ngày phải có định dạng YYYY-MM-DD.");
    }
    const parsed = civilDate(value);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        return invalidCalendar(field, "Ngày không tồn tại.");
    }
    return value;
}
export function calendarText(value: unknown, field: string, max = 1000): string {
    if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
        return invalidCalendar(field, `Vui lòng nhập từ 1 đến ${max} ký tự.`);
    }
    return value.trim();
}
export function expectedRevision(value: unknown): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 2147483646) {
        return invalidCalendar("expectedRevision", "Phiên bản kiểm tra phải là số nguyên dương hợp lệ.");
    }
    return value;
}
function calendarTime(value: unknown, field: string): string {
    if (typeof value !== "string" || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return invalidCalendar(field, "Giờ phải có định dạng HH:mm từ 00:00 đến 23:59.");
    }
    return value;
}
function holidayPolicy(value: unknown, date: string): HolidayPolicy | undefined {
    if (value === undefined) return undefined; // v1 records remain unclassified, never silently statutory/paid.
    const input = calendarObject(value, "exception.holidayPolicy");
    if (input.category === "COMPANY") {
        calendarKeys(input, ["category", "isPaid"], "exception.holidayPolicy.");
        if (typeof input.isPaid !== "boolean") return invalidCalendar("exception.holidayPolicy.isPaid", "Vui lòng xác nhận chính sách hưởng lương của ngày nghỉ doanh nghiệp.");
        return { category: "COMPANY", isPaid: input.isPaid };
    }
    if (input.category === "STATUTORY") {
        calendarKeys(input, ["category", "presetId"], "exception.holidayPolicy.");
        const preset = typeof input.presetId === "string" ? findHolidayPreset(input.presetId) : undefined;
        if (!preset || !preset.dates.includes(date)) return invalidCalendar("exception.holidayPolicy.presetId", "Ngày lễ không thuộc phương án preset đã xác minh. Vui lòng chọn lại nguồn và ngày.");
        return { category: "STATUTORY", presetId: preset.id };
    }
    return invalidCalendar("exception.holidayPolicy.category", "Vui lòng chọn lễ pháp định hoặc ngày nghỉ bổ sung của doanh nghiệp.");
}
export function parseException(value: unknown): CalendarExceptionPayload {
    const input = calendarObject(value, "exception");
    const kind = input.kind;
    const reason = calendarText(input.reason, "exception.reason");
    const date = () => calendarDate(input.date, "exception.date");
    switch (kind) {
        case "HOLIDAY": {
            calendarKeys(input, ["kind", "date", "name", "sourceReference", "reason", "holidayPolicy"], "exception.");
            const day = date();
            const policy = holidayPolicy(input.holidayPolicy, day);
            return { kind, date: day, name: calendarText(input.name, "exception.name", 200),
                sourceReference: calendarText(input.sourceReference, "exception.sourceReference"), reason,
                ...(policy ? { holidayPolicy: policy } : {}) };
        }
        case "COMPENSATORY_OFF":
            calendarKeys(input, ["kind", "date", "sourceHolidayDate", "reason"], "exception.");
            return { kind, date: date(), sourceHolidayDate: calendarDate(input.sourceHolidayDate, "exception.sourceHolidayDate"), reason };
        case "SWAP":
            calendarKeys(input, ["kind", "offDate", "workDate", "reason"], "exception.");
            return { kind, offDate: calendarDate(input.offDate, "exception.offDate"),
                workDate: calendarDate(input.workDate, "exception.workDate"), reason };
        case "WORK_OVERRIDE": {
            calendarKeys(input, ["kind", "date", "startTime", "endTime", "breaks", "reason"], "exception.");
            const startTime = calendarTime(input.startTime, "exception.startTime");
            const endTime = calendarTime(input.endTime, "exception.endTime");
            if (!Array.isArray(input.breaks) || input.breaks.length !== 1) {
                return invalidCalendar("exception.breaks", "Lịch phải có đúng một khoảng nghỉ giữa ca.");
            }
            const interval = calendarObject(input.breaks[0], "exception.breaks.0");
            calendarKeys(interval, ["startTime", "endTime"], "exception.breaks.0.");
            const breakStart = calendarTime(interval.startTime, "exception.breaks.0.startTime");
            const breakEnd = calendarTime(interval.endTime, "exception.breaks.0.endTime");
            if (!(timeMinutes(startTime) < timeMinutes(breakStart) && timeMinutes(breakStart) < timeMinutes(breakEnd) && timeMinutes(breakEnd) < timeMinutes(endTime))) {
                return invalidCalendar("exception.breaks", "Khoảng nghỉ phải nằm giữa giờ vào và giờ ra; ca không được qua ngày.");
            }
            return { kind, date: date(), startTime, endTime, breaks: [{ startTime: breakStart, endTime: breakEnd }], reason };
        }
        default: return invalidCalendar("exception.kind", "Loại ngoại lệ lịch làm việc không hợp lệ.");
    }
}
function queryInt(value: unknown, field: string, fallback: number, max: number): number {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
        return invalidCalendar(field, "Giá trị phân trang không hợp lệ.");
    }
    return Number(value);
}
export function parseExceptionListQuery(query: Record<string, unknown>) {
    calendarKeys(query, ["page", "limit", "kind", "fromDate", "toDate"]);
    const page = queryInt(query.page, "page", 1, 1000000);
    const limit = queryInt(query.limit, "limit", 10, 100);
    let kind: CalendarExceptionPayload["kind"] | undefined;
    if (query.kind !== undefined) {
        if (typeof query.kind !== "string" || !exceptionKinds.includes(query.kind as CalendarExceptionPayload["kind"])) {
            return invalidCalendar("kind", "Loại ngoại lệ lịch làm việc không hợp lệ.");
        }
        kind = query.kind as CalendarExceptionPayload["kind"];
    }
    let fromDate: string | undefined;
    let toDate: string | undefined;
    if (query.fromDate !== undefined || query.toDate !== undefined) {
        fromDate = calendarDate(query.fromDate, "fromDate");
        toDate = calendarDate(query.toDate, "toDate");
        if (fromDate > toDate || civilDayNumber(toDate) - civilDayNumber(fromDate) > 365) {
            return invalidCalendar("toDate", "Khoảng ngày phải theo thứ tự và không vượt quá 366 ngày.");
        }
    }
    return { page, limit, kind, fromDate, toDate };
}
export function parsePreviewQuery(query: Record<string, unknown>) {
    calendarKeys(query, ["versionId", "year", "month"]);
    if (typeof query.versionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query.versionId)) {
        return invalidCalendar("versionId", "Vui lòng chọn bản nháp lịch làm việc hợp lệ.");
    }
    if (typeof query.year !== "string" || !/^[0-9]{4}$/.test(query.year) || query.year === "0000") {
        return invalidCalendar("year", "Năm phải có 4 chữ số từ 0001 đến 9999.");
    }
    if (typeof query.month !== "string" || !/^(0?[1-9]|1[0-2])$/.test(query.month)) {
        return invalidCalendar("month", "Tháng phải từ 1 đến 12.");
    }
    return { versionId: query.versionId, year: Number(query.year), month: Number(query.month) };
}
