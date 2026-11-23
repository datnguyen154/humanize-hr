import type { WorkScheduleConfig } from "./work-schedule.types";

export type HolidayPolicy = { category: "STATUTORY"; presetId: string } | { category: "COMPANY"; isPaid: boolean };

export type CalendarExceptionPayload =
    | { kind: "HOLIDAY"; date: string; name: string; sourceReference: string; reason: string; holidayPolicy?: HolidayPolicy }
    | { kind: "COMPENSATORY_OFF"; date: string; sourceHolidayDate: string; reason: string }
    | { kind: "SWAP"; offDate: string; workDate: string; reason: string }
    | { kind: "WORK_OVERRIDE"; date: string; startTime: string; endTime: string;
        breaks: WorkScheduleConfig["breaks"]; reason: string };

export type CalendarExceptionDto = {
    id: string;
    scheduleVersionId: string;
    payload: CalendarExceptionPayload;
    firstAffectedDate: string;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
};

export type CalendarDayType = "WORKDAY" | "WEEKLY_OFF" | "HOLIDAY" | "COMPENSATORY_OFF" |
    "SWAPPED_OFF" | "SWAPPED_WORKDAY" | "NO_SCHEDULE" | "UNRESOLVED";

export type CalendarIssue = {
    code: "NO_SCHEDULE" | "EXCEPTION_BEFORE_EFFECTIVE_FROM" | "EXCEPTION_DATE_CONFLICT" |
        "SWAP_BASE_DAY_INVALID" | "WORK_OVERRIDE_BASE_DAY_INVALID" |
        "COMPENSATORY_SOURCE_INVALID" | "COMPENSATORY_SOURCE_DUPLICATED" |
        "COMPENSATORY_OFF_REQUIRED" | "COMPENSATORY_DATE_INVALID" | "COMPENSATORY_TARGET_UNRESOLVED";
    severity: "WARNING" | "BLOCKER";
    scope: "MONTH" | "DRAFT";
    date: string | null;
    exceptionIds: string[];
    message: string;
};

export type CalendarShift = Pick<WorkScheduleConfig, "startTime" | "endTime" | "breaks">;

export type CalendarPreviewDay = {
    date: string;
    weekday: number;
    dayType: CalendarDayType;
    isBaseWeeklyOff: boolean | null;
    isWorkingDay: boolean | null;
    shift: CalendarShift | null;
    requiredWorkingMinutes: number | null;
    scheduleVersionId: string | null;
    exceptionIds: string[];
    holidayCategory: "STATUTORY" | "COMPANY" | "UNCLASSIFIED" | null;
    holidayPayPolicy: "PAID" | "UNPAID" | "UNSPECIFIED" | null;
};

export type CalendarPreviewDto = {
    mode: "DRAFT_PROJECTION";
    versionId: string;
    scheduleRevision: number;
    effectiveFrom: string;
    timezone: "Asia/Ho_Chi_Minh";
    year: number;
    month: number;
    sourceFingerprint: string;
    days: CalendarPreviewDay[];
    summary: {
        totalDays: number;
        resolvedDays: number;
        missingScheduleDays: number;
        unresolvedDays: number;
        isComplete: boolean;
        requiredWorkingDays: number | null;
        requiredWorkingMinutes: number | null;
        partialRequiredWorkingDays: number;
        partialRequiredWorkingMinutes: number;
    };
    validation: { hasBlockingIssues: boolean; issues: CalendarIssue[] };
};
