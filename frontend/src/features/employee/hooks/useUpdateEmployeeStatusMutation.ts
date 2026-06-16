import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateEmployeeStatus } from '../api/employee.api'
import type { EmployeeStatus } from '../types/employee.types'
import { employeesQueryKeys } from './useEmployeesQuery'

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
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      void queryClient.invalidateQueries({
        queryKey: employeesQueryKeys.detail(variables.id),
      })
    },
  })
}
