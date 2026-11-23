import type { PaginationMeta } from './work-schedule.types'

export type CalendarExceptionKind =
  | 'HOLIDAY'
  | 'COMPENSATORY_OFF'
  | 'SWAP'
  | 'WORK_OVERRIDE'

export type HolidayPolicy =
  | { category: 'STATUTORY'; presetId: string }
  | { category: 'COMPANY'; isPaid: boolean }

export type HolidayPayload = {
  kind: 'HOLIDAY'
  date: string
  name: string
  sourceReference: string
  reason: string
  holidayPolicy?: HolidayPolicy
}

export type CompensatoryOffPayload = {
  kind: 'COMPENSATORY_OFF'
  date: string
  sourceHolidayDate: string
  reason: string
}

export type SwapPayload = {
  kind: 'SWAP'
  offDate: string
  workDate: string
  reason: string
}

export type WorkOverridePayload = {
  kind: 'WORK_OVERRIDE'
  date: string
  startTime: string
  endTime: string
  breaks: [{ startTime: string; endTime: string }]
  reason: string
}

export type CalendarExceptionPayload =
  | HolidayPayload
  | CompensatoryOffPayload
  | SwapPayload
  | WorkOverridePayload

// Presets Types
export type HolidayPreset = {
  id: string
  year: number
  holidayCode: string
  name: string
  optionLabel?: string | null
  dates: string[]
  sourceReference: string
  sourceUrls: string[]
  suggestedReason: string
  verifiedOn: string
}

export type UnavailableHoliday = {
  holidayCode: string
  name?: string
  reason: string
}

export type HolidayPresetCatalog = {
  catalogVersion: string
  year: number
  timezone: 'Asia/Ho_Chi_Minh'
  requiresConfirmation: boolean
  presets: HolidayPreset[]
  unavailable: UnavailableHoliday[]
  notice: string
}

// Batch Preview & Commit Types
export type BatchHolidayItem = {
  kind: 'HOLIDAY'
  date: string
  name: string
  sourceReference: string
  reason: string
  holidayPolicy: HolidayPolicy
}

export type BatchPreviewRequest = {
  expectedRevision: number
  includeCompensatoryOff: boolean
  holidays: BatchHolidayItem[]
}

export type SkippedDay = {
  exceptionId: string
  date: string
  kind: 'HOLIDAY' | 'COMPENSATORY_OFF'
}

export type HolidayBatchPlan = {
  scheduleRevision: number
  catalogVersion: string
  planFingerprint: string
  toCreate: CalendarExceptionPayload[]
  skipped: SkippedDay[]
  calendarDays: CalendarPreviewDay[]
  validation: {
    hasBlockingIssues: boolean
    issues: CalendarIssue[]
  }
}

export type BatchCommitRequest = BatchPreviewRequest & {
  planFingerprint: string
}

export type BatchCommitResponse = {
  data: {
    created: CalendarExceptionDto[]
    skipped: SkippedDay[]
    scheduleRevision: number
  }
}

export type CalendarExceptionDto = {
  id: string
  scheduleVersionId: string
  payload: CalendarExceptionPayload
  firstAffectedDate: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export type CalendarExceptionListParams = {
  page?: number
  limit?: number
  kind?: CalendarExceptionKind
  fromDate?: string
  toDate?: string
}

export type CalendarExceptionListResponse = {
  data: CalendarExceptionDto[]
  meta: PaginationMeta
  scheduleRevision: number
}

export type CalendarExceptionDetailResponse = {
  data: {
    exception: CalendarExceptionDto
    scheduleRevision: number
  }
}

export type CreateCalendarExceptionRequest = {
  expectedRevision: number
  exception: CalendarExceptionPayload
}

export type UpdateCalendarExceptionRequest = {
  expectedRevision: number
  exception: CalendarExceptionPayload
}

export type DeleteCalendarExceptionRequest = {
  expectedRevision: number
  reason: string
}

export type DeleteCalendarExceptionResponse = {
  data: {
    removedExceptionId: string
    scheduleRevision: number
  }
}

// Monthly Preview Types
export type CalendarDayType =
  | 'WORKDAY'
  | 'WEEKLY_OFF'
  | 'HOLIDAY'
  | 'COMPENSATORY_OFF'
  | 'SWAPPED_OFF'
  | 'SWAPPED_WORKDAY'
  | 'NO_SCHEDULE'
  | 'UNRESOLVED'

export type CalendarIssueCode =
  | 'NO_SCHEDULE'
  | 'EXCEPTION_BEFORE_EFFECTIVE_FROM'
  | 'EXCEPTION_DATE_CONFLICT'
  | 'SWAP_BASE_DAY_INVALID'
  | 'WORK_OVERRIDE_BASE_DAY_INVALID'
  | 'COMPENSATORY_SOURCE_INVALID'
  | 'COMPENSATORY_SOURCE_DUPLICATED'
  | 'COMPENSATORY_OFF_REQUIRED'
  | 'COMPENSATORY_DATE_INVALID'
  | 'COMPENSATORY_TARGET_UNRESOLVED'

export type CalendarIssue = {
  code: CalendarIssueCode
  severity: 'WARNING' | 'BLOCKER'
  scope: 'MONTH' | 'DRAFT'
  date: string | null
  exceptionIds: string[]
  message: string
}

export type CalendarPreviewDay = {
  date: string
  weekday: number
  dayType: CalendarDayType
  isBaseWeeklyOff: boolean | null
  isWorkingDay: boolean | null
  shift: {
    startTime: string
    endTime: string
    breaks: [{ startTime: string; endTime: string }]
  } | null
  requiredWorkingMinutes: number | null
  scheduleVersionId: string | null
  exceptionIds: string[]
  holidayCategory?: 'STATUTORY' | 'COMPANY' | 'UNCLASSIFIED' | null
  holidayPayPolicy?: 'PAID' | 'UNPAID' | 'UNSPECIFIED' | null
}

export type CalendarPreviewSummary = {
  totalDays: number
  resolvedDays: number
  missingScheduleDays: number
  unresolvedDays: number
  isComplete: boolean
  requiredWorkingDays: number | null
  requiredWorkingMinutes: number | null
  partialRequiredWorkingDays: number
  partialRequiredWorkingMinutes: number
}

export type CalendarPreviewDto = {
  mode: 'DRAFT_PROJECTION'
  versionId: string
  scheduleRevision: number
  effectiveFrom: string
  timezone: 'Asia/Ho_Chi_Minh'
  year: number
  month: number
  sourceFingerprint: string
  days: CalendarPreviewDay[]
  summary: CalendarPreviewSummary
  validation: {
    hasBlockingIssues: boolean
    issues: CalendarIssue[]
  }
}

export type CalendarPreviewParams = {
  versionId: string
  year: number
  month: number
}
