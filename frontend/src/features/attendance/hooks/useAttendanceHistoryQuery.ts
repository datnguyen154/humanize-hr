import { useQuery } from '@tanstack/react-query'

import { getAttendanceHistory } from '../api/attendance.api'
import type {
  AttendanceHistoryQueryParams,
  AttendanceListQueryParams,
} from '../types/attendance.types'

export const attendanceQueryKeys = {
  all: ['attendance'] as const,
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
  })
}
