import { useQuery } from '@tanstack/react-query'

import { getAttendanceList } from '../api/attendance.api'
import { attendanceQueryKeys } from './useAttendanceHistoryQuery'
import type { AttendanceListQueryParams } from '../types/attendance.types'

export function useAttendanceListQuery(params: AttendanceListQueryParams) {
  return useQuery({
    queryKey: attendanceQueryKeys.list(params),
    queryFn: () => getAttendanceList(params),
  })
}
