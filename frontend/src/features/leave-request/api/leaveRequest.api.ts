import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'

import type {
  CreateLeaveRequestRequest,
  LeaveRequestDetailResponse,
  LeaveRequestsQueryParams,
  LeaveRequestsResponse,
  UpdateLeaveRequestStatusRequest,
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

export const getLeaveRequestById = async (id: string) => {
  const response = await axiosInstance.get<LeaveRequestDetailResponse>(
    `/leave-requests/${id}`,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}

export const createLeaveRequest = async (
  payload: CreateLeaveRequestRequest,
) => {
  const response = await axiosInstance.post<LeaveRequestDetailResponse>(
    '/leave-requests',
    payload,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}

export const updateLeaveRequestStatus = async (
  id: string,
  payload: UpdateLeaveRequestStatusRequest,
) => {
  const response = await axiosInstance.patch<LeaveRequestDetailResponse>(
    `/leave-requests/${id}/status`,
    payload,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}
