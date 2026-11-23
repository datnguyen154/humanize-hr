import type { CalendarExceptionListParams } from '../types/calendar-exception.types'
import type { WorkScheduleListParams } from '../types/work-schedule.types'

export const workScheduleQueryKeys = {
  all: ['work-schedule'] as const,
  lists: () => [...workScheduleQueryKeys.all, 'list'] as const,
  list: (params?: WorkScheduleListParams) => [...workScheduleQueryKeys.lists(), params] as const,
  options: () => [...workScheduleQueryKeys.lists(), 'options'] as const,
  details: () => [...workScheduleQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...workScheduleQueryKeys.details(), id] as const,
}

export const calendarExceptionQueryKeys = {
  all: ['calendar-exception'] as const,
  lists: () => [...calendarExceptionQueryKeys.all, 'list'] as const,
  versionLists: (versionId: string) => [...calendarExceptionQueryKeys.lists(), versionId] as const,
  list: (versionId: string, params?: CalendarExceptionListParams) => [...calendarExceptionQueryKeys.versionLists(versionId), params] as const,
  details: () => [...calendarExceptionQueryKeys.all, 'detail'] as const,
  versionDetails: (versionId: string) => [...calendarExceptionQueryKeys.details(), versionId] as const,
  detail: (versionId: string, id: string) => [...calendarExceptionQueryKeys.versionDetails(versionId), id] as const,
}

export const calendarPreviewQueryKeys = {
  all: ['calendar-preview'] as const,
  previews: () => [...calendarPreviewQueryKeys.all, 'preview'] as const,
  versionPreviews: (versionId: string) => [...calendarPreviewQueryKeys.previews(), versionId] as const,
  preview: (versionId: string, year: number, month: number) => [...calendarPreviewQueryKeys.versionPreviews(versionId), year, month] as const,
}

export const holidayPresetQueryKeys = {
  all: ['holiday-presets'] as const,
  byYear: (year: number) => [...holidayPresetQueryKeys.all, year] as const,
}
