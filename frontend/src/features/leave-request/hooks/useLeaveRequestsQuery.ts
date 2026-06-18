import { useQuery } from '@tanstack/react-query'

import {
  getLeaveRequestById,
  getLeaveRequests,
} from '../api/leaveRequest.api'
import type { LeaveRequestsQueryParams } from '../types/leaveRequest.types'

export const leaveRequestQueryKeys = {
  all: ['leave-requests'] as const,
  list: (params: LeaveRequestsQueryParams) =>
    [...leaveRequestQueryKeys.all, 'list', params] as const,
  detail: (id: string) =>
    [...leaveRequestQueryKeys.all, 'detail', id] as const,
}

export function useLeaveRequestsQuery(params: LeaveRequestsQueryParams) {
  return useQuery({
    queryKey: leaveRequestQueryKeys.list(params),
    queryFn: () => getLeaveRequests(params),
  })
}

export function useLeaveRequestDetailQuery(id: string) {
  return useQuery({
    queryKey: leaveRequestQueryKeys.detail(id),
    queryFn: () => getLeaveRequestById(id),
    enabled: Boolean(id),
  })
}
