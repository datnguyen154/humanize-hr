import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'

import type {
  LeaveRequestsQueryParams,
  LeaveRequestsResponse,
} from '../types/leaveRequest.types'

const getAuthHeaders = () => {
  const accessToken = authStorage.getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

export const getLeaveRequests = async (params: LeaveRequestsQueryParams) => {
  const response = await axiosInstance.get<LeaveRequestsResponse>(
    '/leave-requests',
    {
      params,
      headers: getAuthHeaders(),
    },
  )

  return response.data
}
