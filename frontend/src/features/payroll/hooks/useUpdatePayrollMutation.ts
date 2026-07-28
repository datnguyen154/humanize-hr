import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updatePayroll } from '../api/payroll.api'
import { payrollQueryKeys } from '../lib/payroll.query-keys'
import type { UpdatePayrollRequest } from '../types/payroll.types'

type UpdatePayrollMutationParams = {
  id: string
  payload: UpdatePayrollRequest
}

export function useUpdatePayrollMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdatePayrollMutationParams) =>
      updatePayroll(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: payrollQueryKeys.all,
      })
    },
  })
}
