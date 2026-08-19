import { useQuery } from '@tanstack/react-query'

import { getLeaveApprovers } from '../api/leaveRequest.api'
import { leaveRequestQueryKeys } from './useLeaveRequestsQuery'

export function useLeaveApproversQuery(enabled = true) {
  return useQuery({
    queryKey: leaveRequestQueryKeys.approvers(),
    queryFn: getLeaveApprovers,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
