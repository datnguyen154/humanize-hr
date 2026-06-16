import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateEmployeeStatus } from '../api/employee.api'
import { employeeQueryKeys } from '../lib/employee.query-keys'
import type { EmployeeStatus } from '../types/employee.types'

type UpdateEmployeeStatusMutationParams = {
  id: string
  status: EmployeeStatus
}

export function useUpdateEmployeeStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: UpdateEmployeeStatusMutationParams) =>
      updateEmployeeStatus(id, status),
    onSuccess: (_employeeStatus, variables) => {
      void queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all })
      void queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detail(variables.id),
      })
    },
  })
}
