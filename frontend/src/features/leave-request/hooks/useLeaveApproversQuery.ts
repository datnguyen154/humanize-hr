import { useQuery } from '@tanstack/react-query'

import { getLeaveApprovers } from '../api/leaveRequest.api'
import { leaveRequestQueryKeys } from './useLeaveRequestsQuery'

export function useLeaveApproversQuery() {
  return useQuery({
    queryKey: leaveRequestQueryKeys.approvers(),
    queryFn: getLeaveApprovers,
    staleTime: 5 * 60 * 1000,
  })
}
