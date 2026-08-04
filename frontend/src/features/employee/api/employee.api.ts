import { axiosInstance } from '@/shared/api'

import { authStorage } from '../../auth'
import type {
  CreateEmployeeRequest,
  EmployeeDetail,
  EmployeeStatus,
  DownloadEmployeeImportTemplateResult,
  ExportEmployeesParams,
  ExportEmployeesResult,
  EmployeesQueryParams,
  EmployeesResponse,
  ImportEmployeesResponse,
  MyEmployeeProfile,
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

export const exportEmployees = async (
  params: ExportEmployeesParams,
): Promise<ExportEmployeesResult> => {
  const response = await axiosInstance.get<Blob>('/employees/export', {
    params,
    headers: getAuthHeaders(),
    responseType: 'blob',
  })
  const contentDisposition = response.headers['content-disposition']

  return {
    blob: response.data,
    contentDisposition:
      typeof contentDisposition === 'string' ? contentDisposition : undefined,
  }
}

export const importEmployees = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post<ImportEmployeesResponse>(
    '/employees/import',
    formData,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}

export const downloadEmployeeImportTemplate =
  async (): Promise<DownloadEmployeeImportTemplateResult> => {
    const response = await axiosInstance.get<Blob>(
      '/employees/import-template',
      {
        headers: getAuthHeaders(),
        responseType: 'blob',
      },
    )
    const contentDisposition = response.headers['content-disposition']

    return {
      blob: response.data,
      contentDisposition:
        typeof contentDisposition === 'string'
          ? contentDisposition
          : undefined,
    }
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

export const getMyEmployeeProfile = async () => {
  const response = await axiosInstance.get<MyEmployeeProfile>('/employees/me', {
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
