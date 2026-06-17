import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateDepartmentStatus } from '../api/department.api'
import { departmentQueryKeys } from './useDepartmentsQuery'
import type { DepartmentStatus } from '../types/department.types'

type UpdateDepartmentStatusMutationParams = {
  id: string
  status: DepartmentStatus
}

export function useUpdateDepartmentStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: UpdateDepartmentStatusMutationParams) =>
      updateDepartmentStatus(id, status),
    onSuccess: (_departmentStatus, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.all,
      })
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.detail(variables.id),
      })
    },
  })
}
