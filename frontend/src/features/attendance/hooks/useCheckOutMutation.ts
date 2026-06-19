import { useMutation, useQueryClient } from '@tanstack/react-query'

import { checkOut } from '../api/attendance.api'
import { attendanceQueryKeys } from './useAttendanceHistoryQuery'

export function useCheckOutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: checkOut,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.all,
      })
    },
  })
}
