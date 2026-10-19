import { AxiosError } from 'axios'
import type { AttendanceAdjustmentStatus } from '../types/attendance-adjustment.types'

export const adjustmentStatusLabels: Record<AttendanceAdjustmentStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
}

export const adjustmentStatusTones = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
} as const

export const formatAttendanceAdjustmentDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC' }).format(new Date(value))

export const formatAttendanceAdjustmentTimestamp = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short',
  }).format(new Date(value))

export const formatAttendanceAdjustmentTime = (value: string | null) => value
  ? new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(value))
  : '--:--'

const errorLabels: Record<string, string> = {
  'Employee profile not found': 'Không tìm thấy hồ sơ nhân viên của bạn.',
  'Attendance adjustment not found': 'Không tìm thấy yêu cầu điều chỉnh.',
  'A pending adjustment already exists for this date': 'Ngày này đã có yêu cầu đang chờ duyệt.',
  'Attendance changed since request': 'Dữ liệu chấm công đã thay đổi. Vui lòng kiểm tra và gửi lại yêu cầu.',
  'Attendance adjustment already reviewed': 'Yêu cầu này đã được xử lý.',
  'Future attendance is not allowed': 'Không thể điều chỉnh ngày hoặc giờ trong tương lai.',
  'Invalid attendance times': 'Giờ chấm công không hợp lệ hoặc không thuộc ngày đã chọn.',
  'No changes requested': 'Giờ đề xuất trùng với dữ liệu chấm công hiện tại.',
  'Invalid attendanceDate': 'Ngày chấm công không hợp lệ.',
  'Invalid checkInTime': 'Giờ vào không hợp lệ.',
  'Invalid checkOutTime': 'Giờ ra không hợp lệ.',
  'reason is required': 'Vui lòng nhập lý do điều chỉnh.',
  'reason is too long': 'Lý do không được quá 1000 ký tự.',
  'reviewNote is required': 'Vui lòng nhập lý do từ chối.',
  'reviewNote is too long': 'Ghi chú không được quá 1000 ký tự.',
}

export function getAttendanceAdjustmentError(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message && errorLabels[message]) return errorLabels[message]
  }
  return fallback
}
