import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  activateWorkScheduleVersion,
  createWorkScheduleVersion,
  getWorkScheduleVersionById,
  getWorkScheduleVersions,
  updateWorkScheduleVersion,
} from '../api/work-schedule.api'
import type {
  CreateWorkScheduleRequest,
  UpdateWorkScheduleRequest,
  WorkScheduleListParams,
} from '../types/work-schedule.types'
import { invalidateCalendarVersion } from '../lib/work-calendar.cache'
import { workScheduleQueryKeys } from '../lib/work-calendar.query-keys'
export { workScheduleQueryKeys } from '../lib/work-calendar.query-keys'

export function useWorkScheduleListQuery(params?: WorkScheduleListParams, enabled = true) {
  return useQuery({
    queryKey: workScheduleQueryKeys.list(params),
    queryFn: ({ signal }) => getWorkScheduleVersions(params, signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useWorkScheduleOptionsQuery() {
  return useQuery({
    queryKey: workScheduleQueryKeys.options(),
    queryFn: async ({ signal }) => {
      const data = []
      let page = 1
      while (true) {
        const response = await getWorkScheduleVersions({ page, limit: 100 }, signal)
        data.push(...response.data)
        if (!response.meta.hasNextPage) return [...new Map(data.map((item) => [item.id, item])).values()]
        page += 1
      }
    },
  })
}

export function useWorkScheduleDetailQuery(id: string) {
  return useQuery({
    queryKey: workScheduleQueryKeys.detail(id),
    queryFn: ({ signal }) => getWorkScheduleVersionById(id, signal),
    enabled: Boolean(id),
  })
}

export function useCreateWorkScheduleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateWorkScheduleRequest) =>
      createWorkScheduleVersion(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(workScheduleQueryKeys.detail(result.id), result)
      void queryClient.invalidateQueries({
        queryKey: workScheduleQueryKeys.lists(),
      })
    },
  })
}

export function useUpdateWorkScheduleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateWorkScheduleRequest
    }) => updateWorkScheduleVersion(id, payload),
    onSuccess: (result) => {
      queryClient.setQueryData(workScheduleQueryKeys.detail(result.id), result)
      void queryClient.invalidateQueries({
        queryKey: workScheduleQueryKeys.lists(),
      })
      void invalidateCalendarVersion(queryClient, result.id)
    },
  })
}

export function useActivateWorkScheduleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, expectedRevision }: { id: string; expectedRevision: number }) =>
      activateWorkScheduleVersion(id, expectedRevision),
    onSuccess: (result) => {
      // The version leaves the DRAFT list and joins the ACTIVE list; calendar caches are now stale.
      queryClient.removeQueries({ queryKey: workScheduleQueryKeys.detail(result.id) })
      void queryClient.invalidateQueries({ queryKey: workScheduleQueryKeys.lists() })
      void invalidateCalendarVersion(queryClient, result.id)
    },
  })
}
