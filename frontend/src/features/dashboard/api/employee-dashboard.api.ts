import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'

import type {
  EmployeeDashboard,
  EmployeeDashboardResponse,
} from '../types/employee-dashboard.types'

const getAuthHeaders = () => {
  const accessToken = authStorage.getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

export const getEmployeeDashboard = async (): Promise<EmployeeDashboard> => {
  const response = await axiosInstance.get<EmployeeDashboardResponse>(
    '/dashboard/employee',
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}
