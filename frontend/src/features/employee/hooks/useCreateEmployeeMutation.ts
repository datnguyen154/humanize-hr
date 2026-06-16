import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createEmployee } from '../api/employee.api'
import type { CreateEmployeeRequest } from '../types/employee.types'

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateEmployeeRequest) => createEmployee(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
