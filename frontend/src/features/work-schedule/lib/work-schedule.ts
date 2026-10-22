import { AxiosError } from 'axios'
import type { WorkScheduleErrorResponse } from '../types/work-schedule.types'

export const WEEKDAYS = [
  { value: 1, label: 'Thứ Hai', short: 'T2' },
  { value: 2, label: 'Thứ Ba', short: 'T3' },
  { value: 3, label: 'Thứ Tư', short: 'T4' },
  { value: 4, label: 'Thứ Năm', short: 'T5' },
  { value: 5, label: 'Thứ Sáu', short: 'T6' },
  { value: 6, label: 'Thứ Bảy', short: 'T7' },
  { value: 7, label: 'Chủ Nhật', short: 'CN' },
] as const

export const DEMO_WORK_SCHEDULE = {
  weekdays: [1, 2, 3, 4, 5],
  startTime: '08:00',
  endTime: '17:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  timezone: 'Asia/Ho_Chi_Minh' as const,
}

export const formatWeekdayList = (weekdays: number[]) => {
  if (!weekdays || weekdays.length === 0) return 'Chưa chọn ngày'
  const sorted = [...weekdays].sort((a, b) => a - b)
  if (sorted.length === 5 && sorted.every((val, idx) => val === idx + 1)) {
    return 'Thứ Hai – Thứ Sáu (T2–T6)'
  }
  if (sorted.length === 6 && sorted.every((val, idx) => val === idx + 1)) {
    return 'Thứ Hai – Thứ Bảy (T2–T7)'
  }
  if (sorted.length === 7) {
    return 'Cả tuần (T2–CN)'
  }
  return sorted
    .map((day) => WEEKDAYS.find((w) => w.value === day)?.short ?? `T${day}`)
    .join(', ')
}

export const formatEffectiveDate = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  return dateStr
}

export const formatDateTime = (isoString: string) => {
  if (!isoString) return ''
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(isoString))
  } catch {
    return isoString
  }
}

export function parseWorkScheduleError(
  error: unknown,
  fallback = 'Không thể xử lý lịch làm việc.',
): {
  code: string
  message: string
  details?: Record<string, string>
  isRevisionConflict: boolean
} {
  if (error instanceof AxiosError) {
    // Timeout error
    if (
      error.code === 'ECONNABORTED' ||
      error.message?.toLowerCase().includes('timeout')
    ) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Hết thời gian chờ phản hồi từ máy chủ. Vui lòng thử lại.',
        isRevisionConflict: false,
      }
    }

    // Network connectivity or route abort error
    if (
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error'
    ) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.',
        isRevisionConflict: false,
      }
    }

    if (error.response?.data) {
      const data = error.response.data as WorkScheduleErrorResponse
      if (data.code === 'WORK_SCHEDULE_REVISION_CONFLICT') {
        return {
          code: data.code,
          message:
            data.message || 'Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu.',
          details: data.details,
          isRevisionConflict: true,
        }
      }
      if (data.code === 'WORK_SCHEDULE_NOT_DRAFT') {
        return {
          code: data.code,
          message:
            data.message || 'Chỉ được thao tác với bản nháp lịch làm việc.',
          details: data.details,
          isRevisionConflict: false,
        }
      }
      if (data.code === 'WORK_SCHEDULE_NOT_FOUND') {
        return {
          code: data.code,
          message:
            data.message || 'Không tìm thấy bản nháp lịch làm việc.',
          details: data.details,
          isRevisionConflict: false,
        }
      }
      if (data.code === 'VALIDATION_ERROR') {
        return {
          code: data.code,
          message:
            data.message || 'Thông tin lịch làm việc không hợp lệ.',
          details: data.details,
          isRevisionConflict: false,
        }
      }
      if (
        data.code === 'INTERNAL_SERVER_ERROR' ||
        error.response.status === 500
      ) {
        return {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Không thể xử lý lịch làm việc. Vui lòng thử lại sau.',
          isRevisionConflict: false,
        }
      }
      if (data.message) {
        return {
          code: data.code || 'UNKNOWN_ERROR',
          message: fallback,
          isRevisionConflict: false,
        }
      }
    }

    if (error.response.status === 500) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Không thể xử lý lịch làm việc. Vui lòng thử lại sau.',
        isRevisionConflict: false,
      }
    }
  }

  if (error instanceof Error && error.message) {
    if (
      error.message === 'Network Error' ||
      error.message.toLowerCase().includes('network')
    ) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.',
        isRevisionConflict: false,
      }
    }
    return {
      code: 'CLIENT_ERROR',
      message: fallback,
      isRevisionConflict: false,
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: fallback,
    isRevisionConflict: false,
  }
}
