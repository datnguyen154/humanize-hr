import { useQuery } from '@tanstack/react-query'
import { getAttendanceMonthlyReport } from '../api/attendance.api'
import { attendanceQueryKeys } from './useAttendanceHistoryQuery'
import type { AttendanceReportPeriod } from '../types/attendance-report.types'

export function useAttendanceMonthlyReportQuery(period: AttendanceReportPeriod) {
  return useQuery({
    queryKey: attendanceQueryKeys.monthlyReport(period),
    queryFn: ({ signal }) => getAttendanceMonthlyReport(period, signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
