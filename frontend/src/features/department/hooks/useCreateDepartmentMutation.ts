import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createDepartment } from '../api/department.api'
import { departmentQueryKeys } from './useDepartmentsQuery'
import type { CreateDepartmentRequest } from '../types/department.types'

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDepartmentRequest) => createDepartment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.all,
      })
    },
  })
}
