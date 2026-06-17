import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateDepartment } from '../api/department.api'
import { departmentQueryKeys } from './useDepartmentsQuery'
import type { UpdateDepartmentRequest } from '../types/department.types'

type UpdateDepartmentMutationParams = {
  id: string
  payload: UpdateDepartmentRequest
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateDepartmentMutationParams) =>
      updateDepartment(id, payload),
    onSuccess: (_department, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.all,
      })
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.detail(variables.id),
      })
    },
  })
}
