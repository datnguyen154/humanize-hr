import { axiosInstance } from '@/shared/api'

import { authStorage } from '../../auth'
import type {
  CreateEmployeeRequest,
  EmployeeDetail,
  EmployeesQueryParams,
  EmployeesResponse,
  UpdateEmployeeRequest,
  UpdateEmployeeStatusResponse,
  EmployeeStatus,
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

export const createEmployee = async (payload: CreateEmployeeRequest) => {
  const accessToken = authStorage.getAccessToken()

  const response = await axiosInstance.post<EmployeeDetail>(
    '/employees',
    payload,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  )

  return response.data
}

export const getEmployeeById = async (id: string) => {
  const accessToken = authStorage.getAccessToken()

  const response = await axiosInstance.get<EmployeeDetail>(`/employees/${id}`, {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })

  return response.data
}

export const updateEmployee = async (
  id: string,
  payload: UpdateEmployeeRequest,
) => {
  const accessToken = authStorage.getAccessToken()

  const response = await axiosInstance.patch<{ data: EmployeeDetail }>(
    `/employees/${id}`,
    payload,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  )

  return response.data.data
}

export const updateEmployeeStatus = async (
  id: string,
  status: EmployeeStatus,
) => {
  const accessToken = authStorage.getAccessToken()

  const response = await axiosInstance.patch<{
    data: UpdateEmployeeStatusResponse
  }>(
    `/employees/${id}/status`,
    { status },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  )

  return response.data.data
}
