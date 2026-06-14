import { axiosInstance } from '@/shared/api'

import { authStorage } from '../../auth'
import type {
  EmployeesQueryParams,
  EmployeesResponse,
} from '../types/employee.types'

export const getEmployees = async (params: EmployeesQueryParams) => {
  const accessToken = authStorage.getAccessToken()

  const response = await axiosInstance.get<EmployeesResponse>('/employees', {
    params,
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })

  return response.data
}
