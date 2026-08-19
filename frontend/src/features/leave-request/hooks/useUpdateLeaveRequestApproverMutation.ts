import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateLeaveRequestApprover } from '../api/leaveRequest.api'
import { leaveRequestQueryKeys } from './useLeaveRequestsQuery'
import type { UpdateLeaveRequestApproverRequest } from '../types/leaveRequest.types'

type UpdateLeaveRequestApproverMutationParams = {
  id: string
  payload: UpdateLeaveRequestApproverRequest
}

export function useUpdateLeaveRequestApproverMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateLeaveRequestApproverMutationParams) =>
      updateLeaveRequestApprover(id, payload),
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
