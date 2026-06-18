import { useQuery } from '@tanstack/react-query'

import { getLeaveRequests } from '../api/leaveRequest.api'
import type { LeaveRequestsQueryParams } from '../types/leaveRequest.types'

export const leaveRequestQueryKeys = {
  all: ['leave-requests'] as const,
  list: (params: LeaveRequestsQueryParams) =>
    [...leaveRequestQueryKeys.all, 'list', params] as const,
}

export function useLeaveRequestsQuery(params: LeaveRequestsQueryParams) {
  return useQuery({
    queryKey: leaveRequestQueryKeys.list(params),
    queryFn: () => getLeaveRequests(params),
  })
}
