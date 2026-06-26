import type {
  EmployeeDashboardAttendanceSummary,
  EmployeeDashboardLeaveSummary,
  EmployeeDashboardTodayAttendance,
  EmployeeDashboardWorkingStatus,
} from '@/features/dashboard/types/employee-dashboard.types'

export type EmployeeDashboardKpi = {
  label: string
  value: string
}

export type TodayAttendanceCardViewModel = {
  workingStatus: string
  attendanceStatus: string
  checkInTime: string
  checkOutTime: string
}

const attendanceStatusLabel: Record<string, string> = {
  PRESENT: 'Đúng giờ',
  LATE: 'Đi muộn',
}

const workingStatusLabel: Record<EmployeeDashboardWorkingStatus, string> = {
  NOT_CHECKED_IN: 'Chưa chấm công',
  WORKING: 'Đang làm việc',
  CHECKED_OUT: 'Đã hoàn thành ca làm',
}

const formatTime = (date: string | null | undefined) => {
  if (!date) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(new Date(date))
}

export const getTodayAttendanceLabel = (
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined,
) => {
  if (!todayAttendance?.status) {
    return 'Chưa có trạng thái'
  }

  return attendanceStatusLabel[todayAttendance.status] ?? todayAttendance.status
}

const resolveWorkingStatus = (
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined,
): EmployeeDashboardWorkingStatus => {
  if (todayAttendance?.workingStatus) {
    return todayAttendance.workingStatus
  }

  if (todayAttendance?.checkInTime) {
    return todayAttendance.checkOutTime ? 'CHECKED_OUT' : 'WORKING'
  }

  return 'NOT_CHECKED_IN'
}

export const createTodayAttendanceCardViewModel = (
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined,
): TodayAttendanceCardViewModel => {
  const workingStatus = resolveWorkingStatus(todayAttendance)

  return {
    workingStatus: workingStatusLabel[workingStatus],
    attendanceStatus: getTodayAttendanceLabel(todayAttendance),
    checkInTime: formatTime(todayAttendance?.checkInTime),
    checkOutTime: formatTime(todayAttendance?.checkOutTime),
  }
}

export const createEmployeeDashboardKpis = ({
  todayAttendance,
  attendanceSummary,
  leaveSummary,
}: {
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined
  attendanceSummary: EmployeeDashboardAttendanceSummary | undefined
  leaveSummary: EmployeeDashboardLeaveSummary | undefined
}): EmployeeDashboardKpi[] => [
  {
    label: 'Trạng thái hôm nay',
    value: getTodayAttendanceLabel(todayAttendance),
  },
  {
    label: 'Đi làm đúng giờ',
    value: String(attendanceSummary?.present ?? 0),
  },
  {
    label: 'Đi muộn',
    value: String(attendanceSummary?.late ?? 0),
  },
  {
    label: 'Đơn chờ duyệt',
    value: String(leaveSummary?.pendingLeaveRequests ?? 0),
  },
]
