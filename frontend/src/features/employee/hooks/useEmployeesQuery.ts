import { useQuery } from '@tanstack/react-query'

import { getEmployeeById, getEmployees } from '../api/employee.api'
import type { EmployeesQueryParams } from '../types/employee.types'

export const employeesQueryKeys = {
  list: (params: EmployeesQueryParams) => ['employees', params] as const,
  detail: (id: string) => ['employees', 'detail', id] as const,
}

export function useEmployeesQuery(params: EmployeesQueryParams) {
  return useQuery({
    queryKey: employeesQueryKeys.list(params),
    queryFn: () => getEmployees(params),
  })
}

export function useEmployeeDetailQuery(id: string) {
  return useQuery({
    queryKey: employeesQueryKeys.detail(id),
    queryFn: () => getEmployeeById(id),
    enabled: Boolean(id),
  })
}
