import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateEmployee } from '../api/employee.api'
import { employeesQueryKeys } from './useEmployeesQuery'
import type { UpdateEmployeeRequest } from '../types/employee.types'

type UpdateEmployeeMutationParams = {
  id: string
  payload: UpdateEmployeeRequest
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateEmployeeMutationParams) =>
      updateEmployee(id, payload),
    onSuccess: (_employee, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      void queryClient.invalidateQueries({
        queryKey: employeesQueryKeys.detail(variables.id),
      })
    },
  })
}
