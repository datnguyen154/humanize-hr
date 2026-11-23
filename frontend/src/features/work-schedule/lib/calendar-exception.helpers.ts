import { CalendarReloadError } from './calendar-exception.editor'
import { AxiosError } from 'axios'
import type {
  CalendarDayType,
  CalendarExceptionDto,
  CalendarExceptionKind,
  CalendarIssueCode,
} from '../types/calendar-exception.types'

export const EXCEPTION_KIND_LABELS: Record<CalendarExceptionKind, string> = {
  HOLIDAY: 'Ngày lễ',
  COMPENSATORY_OFF: 'Nghỉ bù',
  SWAP: 'Hoán đổi ngày làm',
  WORK_OVERRIDE: 'Điều chỉnh giờ làm',
}

export const DAY_TYPE_LABELS: Record<CalendarDayType, string> = {
  WORKDAY: 'Ngày làm việc',
  WEEKLY_OFF: 'Nghỉ tuần',
  HOLIDAY: 'Nghỉ lễ',
  COMPENSATORY_OFF: 'Nghỉ bù',
  SWAPPED_OFF: 'Nghỉ hoán đổi',
  SWAPPED_WORKDAY: 'Làm bù hoán đổi',
  NO_SCHEDULE: 'Chưa có lịch',
  UNRESOLVED: 'Chưa xác định',
}

export const ISSUE_CODE_LABELS: Record<CalendarIssueCode, string> = {
  NO_SCHEDULE: 'Chưa áp dụng lịch trước ngày hiệu lực',
  EXCEPTION_BEFORE_EFFECTIVE_FROM: 'Ngoại lệ trước ngày hiệu lực',
  EXCEPTION_DATE_CONFLICT: 'Xung đột ngày giữa các ngoại lệ',
  SWAP_BASE_DAY_INVALID: 'Ngày hoán đổi không khớp lịch nền',
  WORK_OVERRIDE_BASE_DAY_INVALID: 'Điều chỉnh ca trên ngày không làm việc',
  COMPENSATORY_SOURCE_INVALID: 'Nguồn ngày lễ nghỉ bù không hợp lệ',
  COMPENSATORY_SOURCE_DUPLICATED: 'Ngày lễ đã được gán nghỉ bù trước đó',
  COMPENSATORY_OFF_REQUIRED: 'Ngày lễ trùng nghỉ tuần yêu cầu bố trí nghỉ bù',
  COMPENSATORY_DATE_INVALID: 'Ngày nghỉ bù không đúng quy tắc kế tiếp',
  COMPENSATORY_TARGET_UNRESOLVED: 'Chưa xác định được ngày nghỉ bù hợp lệ',
}

export function formatCivilDateVN(dateStr?: string | null): string {
  if (!dateStr) return '--/--/----'
  const [y, m, d] = dateStr.split('-')
  if (!y || !m || !d) return dateStr
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
}

export function formatMinutesToHours(minutes: number | null | undefined): string {
  if (minutes == null) return '--'
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours === 0) return `${remainingMinutes}m`
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

export function getExceptionSummaryText(exception: CalendarExceptionDto): string {
  const p = exception.payload
  switch (p.kind) {
    case 'HOLIDAY':
      return `${p.name} (${formatCivilDateVN(p.date)})`
    case 'COMPENSATORY_OFF':
      return `Nghỉ bù ngày ${formatCivilDateVN(p.date)} (từ lễ ${formatCivilDateVN(p.sourceHolidayDate)})`
    case 'SWAP':
      return `Nghỉ ${formatCivilDateVN(p.offDate)} ⇄ Làm ${formatCivilDateVN(p.workDate)}`
    case 'WORK_OVERRIDE':
      return `Ca ${p.startTime}–${p.endTime} ngày ${formatCivilDateVN(p.date)}`
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  WORK_SCHEDULE_REVISION_CONFLICT: 'Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu.',
  WORK_CALENDAR_EXCEPTION_CONFLICT: 'Ngày đã có ngoại lệ khác. Vui lòng kiểm tra lại lịch.',
  WORK_CALENDAR_EXCEPTION_REFERENCED: 'Ngày lễ đang được liên kết với nghỉ bù. Vui lòng xử lý nghỉ bù trước.',
  WORK_CALENDAR_EXCEPTION_NOT_FOUND: 'Không tìm thấy ngoại lệ lịch làm việc.',
  WORK_SCHEDULE_NOT_FOUND: 'Không tìm thấy bản nháp lịch làm việc.',
  WORK_SCHEDULE_NOT_DRAFT: 'Chỉ được thao tác với bản nháp lịch làm việc.',
  WORK_CALENDAR_BATCH_PLAN_CHANGED: 'Kế hoạch kỳ nghỉ đã thay đổi. Vui lòng bấm "Xem trước" lại trước khi lưu.',
  WORK_CALENDAR_BATCH_UNRESOLVED: 'Chưa xác định được ngày nghỉ bù hợp lệ cho kỳ nghỉ. Vui lòng kiểm tra lại cấu hình hoặc bỏ chọn tự động nghỉ bù.',
  WORK_CALENDAR_PRESET_NOT_FOUND: 'Mẫu ngày lễ không tồn tại trong danh mục đã xác minh.',
  WORK_CALENDAR_PRESET_OPTION_CONFLICT: 'Không được chọn nhiều phương án cho cùng một dịp lễ trong cùng bản nháp.',
  WORK_CALENDAR_HOLIDAY_POLICY_INVALID: 'Chính sách ngày nghỉ không hợp lệ.',
  VALIDATION_ERROR: 'Thông tin ngoại lệ lịch làm việc không hợp lệ.',
  INTERNAL_SERVER_ERROR: 'Không thể xử lý ngoại lệ lịch làm việc. Vui lòng thử lại sau.',
}

const SERVER_MESSAGE_CODES = new Set([
  'WORK_SCHEDULE_EFFECTIVE_FROM_TOO_EARLY',
  'WORK_SCHEDULE_EFFECTIVE_FROM_OVERLAP',
  'WORK_SCHEDULE_CALENDAR_BLOCKED',
])

export function parseCalendarExceptionError(error: unknown, fallback = 'Không thể xử lý ngoại lệ lịch làm việc.'): {
  code: string; message: string; details?: Record<string, string>; isRevisionConflict: boolean
} {
  if (error instanceof CalendarReloadError) return { code: 'RELOAD_ERROR', message: error.message, isRevisionConflict: false }
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') return { code: 'TIMEOUT_ERROR', message: 'Hết thời gian chờ phản hồi từ máy chủ. Vui lòng thử lại.', isRevisionConflict: false }
    if (!error.response) return { code: 'NETWORK_ERROR', message: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.', isRevisionConflict: false }
    const data = error.response.data as { code?: unknown; details?: unknown; message?: unknown } | undefined
    const code = typeof data?.code === 'string' ? data.code : 'UNKNOWN_ERROR'
    const details = code === 'VALIDATION_ERROR' && data?.details && typeof data.details === 'object'
      ? Object.fromEntries(Object.entries(data.details).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && Boolean(entry[1].trim())))
      : undefined
    // Activation messages carry dates computed by the backend, so its Vietnamese text is shown as-is.
    const serverMessage = SERVER_MESSAGE_CODES.has(code) && typeof data?.message === 'string' ? data.message : undefined
    return { code, message: ERROR_MESSAGES[code] ?? serverMessage ?? fallback, details, isRevisionConflict: code === 'WORK_SCHEDULE_REVISION_CONFLICT' }
  }
  return { code: 'UNKNOWN_ERROR', message: fallback, isRevisionConflict: false }
}
