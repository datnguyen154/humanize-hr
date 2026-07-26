import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  getLeaveRequestById,
  getLeaveRequests,
} from '../api/leaveRequest.api'
import type { LeaveRequestsQueryParams } from '../types/leaveRequest.types'

export const leaveRequestQueryKeys = {
  all: ['leave-requests'] as const,
  lists: () => [...leaveRequestQueryKeys.all, 'list'] as const,
  list: (params: LeaveRequestsQueryParams, scope = 'admin') =>
    [...leaveRequestQueryKeys.lists(), scope, params] as const,
  detail: (id: string) =>
    [...leaveRequestQueryKeys.all, 'detail', id] as const,
}

export function useLeaveRequestsQuery(
  params: LeaveRequestsQueryParams,
  scope?: string,
) {
  return useQuery({
    queryKey: leaveRequestQueryKeys.list(params, scope),
    queryFn: () => getLeaveRequests(params),
    placeholderData: keepPreviousData,
  })
}

export function useLeaveRequestDetailQuery(id: string) {
  return useQuery({
    queryKey: leaveRequestQueryKeys.detail(id),
    queryFn: () => getLeaveRequestById(id),
    enabled: Boolean(id),
  })
}
