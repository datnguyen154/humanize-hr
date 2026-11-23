import type { AttendanceReportPeriod } from './attendance-report.types'

export type TimesheetDayStatus =
  | 'PRESENT' | 'LATE' | 'PAID_LEAVE' | 'UNPAID_LEAVE' | 'ABSENT' | 'UPCOMING'
  | 'DAY_OFF' | 'OUT_OF_SCHEDULE' | 'NO_SCHEDULE' | 'NOT_EMPLOYED'

export type TimesheetSummary = {
  requiredDays: number
  presentDays: number
  lateDays: number
  paidLeaveDays: number
  unpaidLeaveDays: number
  absentDays: number
  upcomingDays: number
  outOfScheduleDays: number
  missingCheckOutDays: number
  noScheduleDays: number
  payableDays: number
}

export type TimesheetEmployee = {
  id: string
  employeeCode: string
  fullName: string
  departmentName: string | null
  status: 'ACTIVE' | 'INACTIVE'
  joinedAt: string
}

export type TimesheetDay = {
  date: string
  weekday: number
  dayType: string
  status: TimesheetDayStatus
  isPayable: boolean
  checkInTime: string | null
  checkOutTime: string | null
  missingCheckOut: boolean
  leaveType: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER' | null
}

export type CompanyTimesheet = {
  period: AttendanceReportPeriod
  /** Working days of the ACTIVE calendar; null when part of the month has no ACTIVE calendar. */
  standardDays: number | null
  isCalendarComplete: boolean
  employees: { employee: TimesheetEmployee; summary: TimesheetSummary }[]
}

export type EmployeeTimesheet = {
  period: AttendanceReportPeriod
  standardDays: number | null
  isCalendarComplete: boolean
  employee: TimesheetEmployee
  summary: TimesheetSummary
  days: TimesheetDay[]
}
