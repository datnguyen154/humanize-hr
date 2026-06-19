import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateLeaveRequestStatus } from '../api/leaveRequest.api'
import { leaveRequestQueryKeys } from './useLeaveRequestsQuery'
import type { UpdateLeaveRequestStatusRequest } from '../types/leaveRequest.types'

type UpdateLeaveRequestStatusMutationParams = {
  id: string
  payload: UpdateLeaveRequestStatusRequest
}

export function useUpdateLeaveRequestStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateLeaveRequestStatusMutationParams) =>
      updateLeaveRequestStatus(id, payload),
    onSuccess: (leaveRequest, variables) => {
      queryClient.setQueryData(
        leaveRequestQueryKeys.detail(variables.id),
        leaveRequest,
      )
      void queryClient.invalidateQueries({
        queryKey: leaveRequestQueryKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: leaveRequestQueryKeys.detail(variables.id),
      })
    },
  })
}
