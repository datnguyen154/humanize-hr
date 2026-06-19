import { useMutation, useQueryClient } from '@tanstack/react-query'

import { checkIn } from '../api/attendance.api'
import { attendanceQueryKeys } from './useAttendanceHistoryQuery'

export function useCheckInMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: checkIn,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.all,
      })
    },
  })
}
