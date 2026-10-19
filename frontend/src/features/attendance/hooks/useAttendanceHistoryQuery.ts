import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getAttendanceHistory } from '../api/attendance.api'
import type { AttendanceReportPeriod } from '../types/attendance-report.types'
import type { AttendanceAdjustmentListParams } from '../types/attendance-adjustment.types'
import type {
  AttendanceHistoryQueryParams,
  AttendanceListQueryParams,
} from '../types/attendance.types'

export const attendanceQueryKeys = {
  all: ['attendance'] as const,
  adjustments: () => [...attendanceQueryKeys.all, 'adjustments'] as const,
  adjustmentList: (params: AttendanceAdjustmentListParams) =>
    [...attendanceQueryKeys.adjustments(), 'list', params] as const,
  adjustmentDetail: (id: string) =>
    [...attendanceQueryKeys.adjustments(), 'detail', id] as const,
  monthlyReport: (period: AttendanceReportPeriod) => [...attendanceQueryKeys.all, 'monthly-report', period] as const,
  lists: () => [...attendanceQueryKeys.all, 'list'] as const,
  list: (params: AttendanceListQueryParams) =>
    [...attendanceQueryKeys.lists(), params] as const,
  history: (params: AttendanceHistoryQueryParams) =>
    [...attendanceQueryKeys.all, 'history', params] as const,
}

export function useAttendanceHistoryQuery(
  params: AttendanceHistoryQueryParams,
) {
  return useQuery({
    queryKey: attendanceQueryKeys.history(params),
    queryFn: () => getAttendanceHistory(params),
    placeholderData: keepPreviousData,
  })
}
