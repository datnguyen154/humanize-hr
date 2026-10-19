import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAttendanceAdjustment, reviewAttendanceAdjustment } from '../api/attendance-adjustment.api'
import { adminDashboardQueryKeys } from '@/features/dashboard/hooks/useAdminDashboardQuery'
import { employeeDashboardQueryKey } from '@/features/dashboard/hooks/useEmployeeDashboardQuery'
import type { ReviewAttendanceAdjustmentRequest } from '../types/attendance-adjustment.types'
import { attendanceQueryKeys } from './useAttendanceHistoryQuery'

export function useCreateAttendanceAdjustmentMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createAttendanceAdjustment,
    onSuccess: () => { void client.invalidateQueries({ queryKey: attendanceQueryKeys.adjustments() }) },
  })
}

export function useReviewAttendanceAdjustmentMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewAttendanceAdjustmentRequest }) =>
      reviewAttendanceAdjustment(id, payload),
    onSuccess: (result) => {
      client.setQueryData(attendanceQueryKeys.adjustmentDetail(result.id), result)
      void client.invalidateQueries({ queryKey: attendanceQueryKeys.all })
      if (result.status === 'APPROVED') {
        void client.invalidateQueries({ queryKey: adminDashboardQueryKeys.all })
        void client.invalidateQueries({ queryKey: employeeDashboardQueryKey })
      }
    },
  })
}
