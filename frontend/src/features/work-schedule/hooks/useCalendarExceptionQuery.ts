import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  commitHolidayBatch,
  createCalendarException,
  deleteCalendarException,
  getCalendarExceptionById,
  getCalendarExceptions,
  getCalendarPreview,
  getHolidayPresets,
  previewHolidayBatch,
  updateCalendarException,
} from '../api/calendar-exception.api'
import type {
  BatchCommitRequest,
  BatchPreviewRequest,
  CalendarExceptionListParams,
  CalendarPreviewParams,
  CreateCalendarExceptionRequest,
  DeleteCalendarExceptionRequest,
  UpdateCalendarExceptionRequest,
} from '../types/calendar-exception.types'
import { invalidateCalendarMutation } from '../lib/work-calendar.cache'
import {
  calendarExceptionQueryKeys,
  calendarPreviewQueryKeys,
  holidayPresetQueryKeys,
} from '../lib/work-calendar.query-keys'
export {
  calendarExceptionQueryKeys,
  calendarPreviewQueryKeys,
  holidayPresetQueryKeys,
} from '../lib/work-calendar.query-keys'

export function useCalendarExceptionListQuery(
  versionId: string,
  params?: CalendarExceptionListParams,
) {
  return useQuery({
    queryKey: calendarExceptionQueryKeys.list(versionId, params),
    queryFn: ({ signal }) => getCalendarExceptions(versionId, params, signal),
    enabled: Boolean(versionId),
    placeholderData: (previous, query) => query?.queryKey[2] === versionId ? keepPreviousData(previous) : undefined,
  })
}

export function useCalendarExceptionDetailQuery(
  versionId: string,
  id: string,
) {
  return useQuery({
    queryKey: calendarExceptionQueryKeys.detail(versionId, id),
    queryFn: ({ signal }) => getCalendarExceptionById(versionId, id, signal),
    enabled: Boolean(versionId) && Boolean(id),
  })
}

export function useCalendarPreviewQuery(params: CalendarPreviewParams) {
  const { versionId, year, month } = params
  return useQuery({
    queryKey: calendarPreviewQueryKeys.preview(versionId, year, month),
    queryFn: ({ signal }) => getCalendarPreview(params, signal),
    enabled: Boolean(versionId) && Boolean(year) && Boolean(month),
  })
}

export function useCreateCalendarExceptionMutation(versionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCalendarExceptionRequest) =>
      createCalendarException(versionId, payload),
    onSuccess: () => invalidateCalendarMutation(queryClient, versionId),
  })
}

export function useUpdateCalendarExceptionMutation(versionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateCalendarExceptionRequest
    }) => updateCalendarException(versionId, id, payload),
    onSuccess: () => invalidateCalendarMutation(queryClient, versionId),
  })
}

export function useDeleteCalendarExceptionMutation(versionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: DeleteCalendarExceptionRequest
    }) => deleteCalendarException(versionId, id, payload),
    onSuccess: () => invalidateCalendarMutation(queryClient, versionId),
  })
}

export function useHolidayPresetsQuery(year: number, enabled = true) {
  return useQuery({
    queryKey: holidayPresetQueryKeys.byYear(year),
    queryFn: ({ signal }) => getHolidayPresets(year, signal),
    enabled: enabled && Number.isInteger(year) && year >= 1 && year <= 9999,
    staleTime: 1000 * 60 * 60, // 1 hour static catalog
  })
}

export function useBatchPreviewMutation(versionId: string) {
  return useMutation({
    mutationFn: (payload: BatchPreviewRequest) =>
      previewHolidayBatch(versionId, payload),
  })
}

export function useCommitBatchMutation(versionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BatchCommitRequest) =>
      commitHolidayBatch(versionId, payload),
    onSuccess: () => invalidateCalendarMutation(queryClient, versionId),
  })
}
