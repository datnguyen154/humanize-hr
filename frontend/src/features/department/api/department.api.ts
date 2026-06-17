import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'

import type {
  CreateDepartmentRequest,
  DepartmentDetailResponse,
  DepartmentsQueryParams,
  DepartmentsResponse,
} from '../types/department.types'

const getAuthHeaders = () => {
  const accessToken = authStorage.getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

export const getDepartments = async (params: DepartmentsQueryParams) => {
  const response = await axiosInstance.get<DepartmentsResponse>(
    '/departments',
    {
      params,
      headers: getAuthHeaders(),
    },
  )

  return response.data
}

export const createDepartment = async (payload: CreateDepartmentRequest) => {
  const response = await axiosInstance.post<DepartmentDetailResponse>(
    '/departments',
    payload,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}

export const getDepartmentById = async (id: string) => {
  const response = await axiosInstance.get<DepartmentDetailResponse>(
    `/departments/${id}`,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}
