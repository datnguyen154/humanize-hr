import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'
import type {
  BatchCommitRequest,
  BatchCommitResponse,
  BatchPreviewRequest,
  CalendarExceptionDetailResponse,
  CalendarExceptionDto,
  CalendarExceptionListParams,
  CalendarExceptionListResponse,
  CalendarPreviewDto,
  CalendarPreviewParams,
  CreateCalendarExceptionRequest,
  DeleteCalendarExceptionRequest,
  DeleteCalendarExceptionResponse,
  HolidayBatchPlan,
  HolidayPresetCatalog,
  SkippedDay,
  UpdateCalendarExceptionRequest,
} from '../types/calendar-exception.types'

const authHeaders = () => {
  const token = authStorage.getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export async function getCalendarExceptions(
  versionId: string,
  params?: CalendarExceptionListParams,
  signal?: AbortSignal,
): Promise<CalendarExceptionListResponse> {
  const response = await axiosInstance.get<CalendarExceptionListResponse>(
    `/work-calendar/versions/${versionId}/exceptions`,
    {
      params,
      signal,
      headers: authHeaders(),
    },
  )
  return response.data
}

export async function getCalendarExceptionById(
  versionId: string,
  id: string,
  signal?: AbortSignal,
): Promise<{ exception: CalendarExceptionDto; scheduleRevision: number }> {
  const response = await axiosInstance.get<CalendarExceptionDetailResponse>(
    `/work-calendar/versions/${versionId}/exceptions/${id}`,
    {
      signal,
      headers: authHeaders(),
    },
  )
  return response.data.data
}

export async function createCalendarException(
  versionId: string,
  payload: CreateCalendarExceptionRequest,
): Promise<{ exception: CalendarExceptionDto; scheduleRevision: number }> {
  const response = await axiosInstance.post<CalendarExceptionDetailResponse>(
    `/work-calendar/versions/${versionId}/exceptions`,
    payload,
    {
      headers: authHeaders(),
    },
  )
  return response.data.data
}

export async function updateCalendarException(
  versionId: string,
  id: string,
  payload: UpdateCalendarExceptionRequest,
): Promise<{ exception: CalendarExceptionDto; scheduleRevision: number }> {
  const response = await axiosInstance.patch<CalendarExceptionDetailResponse>(
    `/work-calendar/versions/${versionId}/exceptions/${id}`,
    payload,
    {
      headers: authHeaders(),
    },
  )
  return response.data.data
}

export async function deleteCalendarException(
  versionId: string,
  id: string,
  payload: DeleteCalendarExceptionRequest,
): Promise<{ removedExceptionId: string; scheduleRevision: number }> {
  const response = await axiosInstance.delete<DeleteCalendarExceptionResponse>(
    `/work-calendar/versions/${versionId}/exceptions/${id}`,
    {
      data: payload,
      headers: authHeaders(),
    },
  )
  return response.data.data
}

export async function getCalendarPreview(
  params: CalendarPreviewParams,
  signal?: AbortSignal,
): Promise<CalendarPreviewDto> {
  const response = await axiosInstance.get<{ data: CalendarPreviewDto }>(
    '/work-calendar/preview',
    {
      params: { ...params, year: String(params.year).padStart(4, '0') },
      signal,
      headers: authHeaders(),
    },
  )
  return response.data.data
}

export async function getHolidayPresets(
  year: number,
  signal?: AbortSignal,
): Promise<HolidayPresetCatalog> {
  const response = await axiosInstance.get<{ data: HolidayPresetCatalog }>(
    '/work-calendar/holiday-presets',
    {
      params: { year: String(year).padStart(4, '0') },
      signal,
      headers: authHeaders(),
    },
  )
  return response.data.data
}

export async function previewHolidayBatch(
  versionId: string,
  payload: BatchPreviewRequest,
  signal?: AbortSignal,
): Promise<HolidayBatchPlan> {
  const response = await axiosInstance.post<{ data: HolidayBatchPlan }>(
    `/work-calendar/versions/${versionId}/exceptions/batch-preview`,
    payload,
    {
      signal,
      headers: authHeaders(),
    },
  )
  return response.data.data
}

export async function commitHolidayBatch(
  versionId: string,
  payload: BatchCommitRequest,
): Promise<{ created: CalendarExceptionDto[]; skipped: SkippedDay[]; scheduleRevision: number }> {
  const response = await axiosInstance.post<BatchCommitResponse>(
    `/work-calendar/versions/${versionId}/exceptions/batch`,
    payload,
    {
      headers: authHeaders(),
    },
  )
  return response.data.data
}
