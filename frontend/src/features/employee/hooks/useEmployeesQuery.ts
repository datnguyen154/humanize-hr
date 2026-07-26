import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getEmployeeById, getEmployees } from '../api/employee.api'
import { employeeQueryKeys } from '../lib/employee.query-keys'
import type { EmployeesQueryParams } from '../types/employee.types'

export function useEmployeesQuery(params: EmployeesQueryParams) {
  return useQuery({
    queryKey: employeeQueryKeys.list(params),
    queryFn: () => getEmployees(params),
    placeholderData: keepPreviousData,
  })
}

export function useEmployeeDetailQuery(id: string) {
  return useQuery({
    queryKey: employeeQueryKeys.detail(id),
    queryFn: () => getEmployeeById(id),
    enabled: Boolean(id),
  })
}
