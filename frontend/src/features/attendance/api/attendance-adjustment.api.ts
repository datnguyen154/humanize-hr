import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'
import type {
  AttendanceAdjustment,
  AttendanceAdjustmentListParams,
  AttendanceAdjustmentListResponse,
  CreateAttendanceAdjustmentRequest,
  ReviewAttendanceAdjustmentRequest,
} from '../types/attendance-adjustment.types'

const authHeaders = () => {
  const token = authStorage.getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

const endpoint = '/attendance/adjustment-requests'

export async function getAttendanceAdjustments(params: AttendanceAdjustmentListParams, signal?: AbortSignal) {
  const response = await axiosInstance.get<AttendanceAdjustmentListResponse>(endpoint, {
    params, signal, headers: authHeaders(),
  })
  return response.data
}

export async function getAttendanceAdjustmentById(id: string, signal?: AbortSignal) {
  const response = await axiosInstance.get<{ data: AttendanceAdjustment }>(`${endpoint}/${id}`, {
    signal, headers: authHeaders(),
  })
  return response.data.data
}

export async function createAttendanceAdjustment(payload: CreateAttendanceAdjustmentRequest) {
  const response = await axiosInstance.post<{ data: AttendanceAdjustment }>(endpoint, payload, {
    headers: authHeaders(),
  })
  return response.data.data
}

export async function reviewAttendanceAdjustment(id: string, payload: ReviewAttendanceAdjustmentRequest) {
  const response = await axiosInstance.patch<{ data: AttendanceAdjustment }>(`${endpoint}/${id}/review`, payload, {
    headers: authHeaders(),
  })
  return response.data.data
}
