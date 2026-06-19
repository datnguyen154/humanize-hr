import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'

import type {
  AttendanceHistoryQueryParams,
  AttendanceHistoryResponse,
  AttendanceListQueryParams,
  AttendanceListResponse,
  AttendanceRecordResponse,
} from '../types/attendance.types'

const getAuthHeaders = () => {
  const accessToken = authStorage.getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

export const getAttendanceHistory = async (
  params: AttendanceHistoryQueryParams,
) => {
  const response = await axiosInstance.get<AttendanceHistoryResponse>(
    '/attendance/history',
    {
      params,
      headers: getAuthHeaders(),
    },
  )

  return response.data
}

export const getAttendanceList = async (params: AttendanceListQueryParams) => {
  const response = await axiosInstance.get<AttendanceListResponse>(
    '/attendance',
    {
      params,
      headers: getAuthHeaders(),
    },
  )

  return response.data
}

export const checkIn = async () => {
  const response = await axiosInstance.post<AttendanceRecordResponse>(
    '/attendance/check-in',
    undefined,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}

export const checkOut = async () => {
  const response = await axiosInstance.post<AttendanceRecordResponse>(
    '/attendance/check-out',
    undefined,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}
