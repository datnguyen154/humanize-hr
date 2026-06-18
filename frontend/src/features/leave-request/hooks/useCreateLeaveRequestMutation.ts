import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createLeaveRequest } from '../api/leaveRequest.api'
import { leaveRequestQueryKeys } from './useLeaveRequestsQuery'
import type { CreateLeaveRequestRequest } from '../types/leaveRequest.types'

export function useCreateLeaveRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLeaveRequestRequest) =>
      createLeaveRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: leaveRequestQueryKeys.all,
      })
    },
  })
}
