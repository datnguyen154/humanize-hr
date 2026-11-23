import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createPayroll, createPayrollFromTimesheet } from '../api/payroll.api'
import { payrollQueryKeys } from '../lib/payroll.query-keys'
import type { CreatePayrollFromTimesheetRequest, CreatePayrollRequest } from '../types/payroll.types'

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

export function useCreatePayrollFromTimesheetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePayrollFromTimesheetRequest) => createPayrollFromTimesheet(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: payrollQueryKeys.all,
      })
    },
  })
}
