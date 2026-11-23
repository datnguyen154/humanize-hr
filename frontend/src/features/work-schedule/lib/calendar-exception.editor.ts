import { getCalendarExceptionById } from '../api/calendar-exception.api'
import { getWorkScheduleVersionById } from '../api/work-schedule.api'
import type { CalendarExceptionDto } from '../types/calendar-exception.types'
import type { WorkScheduleDto } from '../types/work-schedule.types'

export type CalendarEditorSnapshot = {
  schedule: WorkScheduleDto
  scheduleRevision: number
  exception?: CalendarExceptionDto
}

export class CalendarReloadError extends Error {}

export async function loadCalendarEditor(versionId: string, exceptionId?: string): Promise<CalendarEditorSnapshot> {
  const [schedule, detail] = await Promise.all([
    getWorkScheduleVersionById(versionId),
    exceptionId ? getCalendarExceptionById(versionId, exceptionId) : undefined,
  ])
  if (!schedule || schedule.id !== versionId || (exceptionId && !detail)) {
    throw new CalendarReloadError('Không thể tải dữ liệu bản nháp mới nhất. Vui lòng thử lại.')
  }
  if (detail && (detail.scheduleRevision !== schedule.revision || detail.exception.scheduleVersionId !== versionId || detail.exception.id !== exceptionId)) {
    throw new CalendarReloadError('Dữ liệu đã thay đổi trong lúc tải lại. Vui lòng thử lại.')
  }
  return { schedule, scheduleRevision: schedule.revision, exception: detail?.exception }
}

export function currentCalendarMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'numeric' }).formatToParts(now)
  return { year: Number(parts.find((p) => p.type === 'year')!.value), month: Number(parts.find((p) => p.type === 'month')!.value) }
}
