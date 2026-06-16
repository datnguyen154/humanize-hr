import { axiosInstance } from '@/shared/api'

import { authStorage } from '../../auth'
import type {
  CreateEmployeeRequest,
  EmployeeDetail,
  EmployeeStatus,
  EmployeesQueryParams,
  EmployeesResponse,
  UpdateEmployeeRequest,
  UpdateEmployeeStatusResponse,
} from '../types/employee.types'

const getAuthHeaders = () => {
  const accessToken = authStorage.getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

export const getEmployees = async (params: EmployeesQueryParams) => {
  const response = await axiosInstance.get<EmployeesResponse>('/employees', {
    params,
    headers: getAuthHeaders(),
  })

  return response.data
}

export const createEmployee = async (payload: CreateEmployeeRequest) => {
  const response = await axiosInstance.post<EmployeeDetail>(
    '/employees',
    payload,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data
}

export const getEmployeeById = async (id: string) => {
  const response = await axiosInstance.get<EmployeeDetail>(`/employees/${id}`, {
    headers: getAuthHeaders(),
  })

  return response.data
}

export const updateEmployee = async (
  id: string,
  payload: UpdateEmployeeRequest,
) => {
  const response = await axiosInstance.patch<{ data: EmployeeDetail }>(
    `/employees/${id}`,
    payload,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}

export const updateEmployeeStatus = async (
  id: string,
  status: EmployeeStatus,
) => {
  const response = await axiosInstance.patch<{
    data: UpdateEmployeeStatusResponse
  }>(
    `/employees/${id}/status`,
    { status },
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}
