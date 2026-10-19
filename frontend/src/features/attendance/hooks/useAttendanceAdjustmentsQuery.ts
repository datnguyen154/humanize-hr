import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getAttendanceAdjustmentById, getAttendanceAdjustments } from '../api/attendance-adjustment.api'
import type { AttendanceAdjustmentListParams } from '../types/attendance-adjustment.types'
import { attendanceQueryKeys } from './useAttendanceHistoryQuery'

export function useAttendanceAdjustmentsQuery(params: AttendanceAdjustmentListParams) {
  return useQuery({
    queryKey: attendanceQueryKeys.adjustmentList(params),
    queryFn: ({ signal }) => getAttendanceAdjustments(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useAttendanceAdjustmentDetailQuery(id: string) {
  return useQuery({
    queryKey: attendanceQueryKeys.adjustmentDetail(id),
    queryFn: ({ signal }) => getAttendanceAdjustmentById(id, signal),
    enabled: Boolean(id),
  })
}
