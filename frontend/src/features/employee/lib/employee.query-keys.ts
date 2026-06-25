import type { EmployeesQueryParams } from '../types/employee.types'

export const employeeQueryKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeQueryKeys.all, 'list'] as const,
  list: (params: EmployeesQueryParams) =>
    [...employeeQueryKeys.lists(), params] as const,
  details: () => [...employeeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeQueryKeys.details(), id] as const,
  me: () => [...employeeQueryKeys.all, 'me'] as const,
}
