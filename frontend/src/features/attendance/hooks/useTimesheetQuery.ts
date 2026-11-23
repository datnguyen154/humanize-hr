import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getCompanyTimesheet, getEmployeeTimesheet, getMyTimesheet } from '../api/attendance.api'
import type { AttendanceReportPeriod } from '../types/attendance-report.types'
import { attendanceQueryKeys } from './useAttendanceHistoryQuery'

// Timesheets are computed on request from live attendance, so they are cached briefly only.
const options = { staleTime: 60 * 1000, placeholderData: keepPreviousData, refetchOnWindowFocus: false } as const

export function useCompanyTimesheetQuery(period: AttendanceReportPeriod) {
  return useQuery({
    queryKey: attendanceQueryKeys.companyTimesheet(period),
    queryFn: ({ signal }) => getCompanyTimesheet(period, signal),
    ...options,
  })
}

export function useEmployeeTimesheetQuery(employeeId: string, period: AttendanceReportPeriod) {
  return useQuery({
    queryKey: attendanceQueryKeys.employeeTimesheet(employeeId, period),
    queryFn: ({ signal }) => getEmployeeTimesheet(employeeId, period, signal),
    enabled: Boolean(employeeId),
    ...options,
  })
}

export function useMyTimesheetQuery(period: AttendanceReportPeriod, enabled = true) {
  return useQuery({
    queryKey: attendanceQueryKeys.myTimesheet(period),
    queryFn: ({ signal }) => getMyTimesheet(period, signal),
    enabled,
    ...options,
  })
}
