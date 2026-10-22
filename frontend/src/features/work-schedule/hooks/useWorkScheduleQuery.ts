import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
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

export const workScheduleQueryKeys = {
  all: ['work-schedule'] as const,
  lists: () => [...workScheduleQueryKeys.all, 'list'] as const,
  list: (params?: WorkScheduleListParams) =>
    [...workScheduleQueryKeys.lists(), params] as const,
  details: () => [...workScheduleQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...workScheduleQueryKeys.details(), id] as const,
}

export function useWorkScheduleListQuery(params?: WorkScheduleListParams) {
  return useQuery({
    queryKey: workScheduleQueryKeys.list(params),
    queryFn: ({ signal }) => getWorkScheduleVersions(params, signal),
    placeholderData: keepPreviousData,
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
    },
  })
}
