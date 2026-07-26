import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getPayrolls } from '../api/payroll.api'
import { payrollQueryKeys } from '../lib/payroll.query-keys'
import type { PayrollsQueryParams } from '../types/payroll.types'

export function usePayrollsQuery(params: PayrollsQueryParams) {
  return useQuery({
    queryKey: payrollQueryKeys.list(params),
    queryFn: () => getPayrolls(params),
    placeholderData: keepPreviousData,
  })
}
