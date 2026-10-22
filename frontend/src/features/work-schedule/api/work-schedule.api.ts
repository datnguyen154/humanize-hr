import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'
import type {
  CreateWorkScheduleRequest,
  UpdateWorkScheduleRequest,
  WorkScheduleDto,
  WorkScheduleListParams,
  WorkScheduleListResponse,
} from '../types/work-schedule.types'

const authHeaders = () => {
  const token = authStorage.getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

const endpoint = '/work-calendar/versions'

export async function getWorkScheduleVersions(
  params?: WorkScheduleListParams,
  signal?: AbortSignal,
): Promise<WorkScheduleListResponse> {
  const response = await axiosInstance.get<WorkScheduleListResponse>(endpoint, {
    params,
    signal,
    headers: authHeaders(),
  })
  return response.data
}

export async function getWorkScheduleVersionById(
  id: string,
  signal?: AbortSignal,
): Promise<WorkScheduleDto> {
  const response = await axiosInstance.get<{ data: WorkScheduleDto }>(
    `${endpoint}/${id}`,
    {
      signal,
      headers: authHeaders(),
    },
  )
  return response.data.data
}

export async function createWorkScheduleVersion(
  payload: CreateWorkScheduleRequest,
): Promise<WorkScheduleDto> {
  const response = await axiosInstance.post<{ data: WorkScheduleDto }>(
    endpoint,
    payload,
    {
      headers: authHeaders(),
    },
  )
  return response.data.data
}

export async function updateWorkScheduleVersion(
  id: string,
  payload: UpdateWorkScheduleRequest,
): Promise<WorkScheduleDto> {
  const response = await axiosInstance.patch<{ data: WorkScheduleDto }>(
    `${endpoint}/${id}`,
    payload,
    {
      headers: authHeaders(),
    },
  )
  return response.data.data
}
