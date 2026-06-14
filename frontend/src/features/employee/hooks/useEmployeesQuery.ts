import { useQuery } from '@tanstack/react-query'

import { getEmployees } from '../api/employee.api'
import type { EmployeesQueryParams } from '../types/employee.types'

export const employeesQueryKeys = {
  list: (params: EmployeesQueryParams) => ['employees', params] as const,
}

export function useEmployeesQuery(params: EmployeesQueryParams) {
  return useQuery({
    queryKey: employeesQueryKeys.list(params),
    queryFn: () => getEmployees(params),
  })
}
