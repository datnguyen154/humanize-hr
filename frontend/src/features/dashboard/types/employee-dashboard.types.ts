import type { AttendanceStatus } from '../../attendance/types/attendance.types'

export type EmployeeDashboardWorkingStatus =
  | 'NOT_CHECKED_IN'
  | 'WORKING'
  | 'CHECKED_OUT'

export type EmployeeDashboardTodayAttendance = {
  status: AttendanceStatus | null
  checkInTime: string | null
  checkOutTime: string | null
  workingStatus?: EmployeeDashboardWorkingStatus
}

export type EmployeeDashboardAttendanceSummary = {
  present: number
  late: number
}

export type EmployeeDashboardLeaveSummary = {
  pendingLeaveRequests: number
  usedAnnualLeave: number
  remainingAnnualLeave: number
}

export type EmployeeDashboardActivityType =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'LEAVE_REQUEST_CREATED'
  | 'LEAVE_REQUEST_APPROVED'
  | 'LEAVE_REQUEST_REJECTED'

export type EmployeeDashboardRecentActivity = {
  type: EmployeeDashboardActivityType
  message: string
  createdAt: string
}

export type EmployeeDashboard = {
  todayAttendance: EmployeeDashboardTodayAttendance
  attendanceSummary: EmployeeDashboardAttendanceSummary
  leaveSummary: EmployeeDashboardLeaveSummary
  recentActivities: EmployeeDashboardRecentActivity[]
}

export type EmployeeDashboardResponse = {
  data: EmployeeDashboard
}

export type EmployeeDashboardQueryResult = {
  todayAttendance: EmployeeDashboardTodayAttendance | undefined
  attendanceSummary: EmployeeDashboardAttendanceSummary | undefined
  leaveSummary: EmployeeDashboardLeaveSummary | undefined
  recentActivities: EmployeeDashboardRecentActivity[] | undefined
  isLoading: boolean
  isError: boolean
}
