import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'

import type {
  AttendanceHistoryQueryParams,
  AttendanceHistoryResponse,
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
