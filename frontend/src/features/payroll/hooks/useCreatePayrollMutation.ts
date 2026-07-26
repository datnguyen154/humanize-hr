import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createPayroll } from '../api/payroll.api'
import { payrollQueryKeys } from '../lib/payroll.query-keys'
import type { CreatePayrollRequest } from '../types/payroll.types'

export function useCreatePayrollMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePayrollRequest) => createPayroll(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: payrollQueryKeys.all,
      })
    },
  })
}
