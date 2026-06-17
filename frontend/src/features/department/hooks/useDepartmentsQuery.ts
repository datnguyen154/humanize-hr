import { useQuery } from '@tanstack/react-query'

import { getDepartments } from '../api/department.api'
import type { DepartmentsQueryParams } from '../types/department.types'

export const departmentQueryKeys = {
  all: ['departments'] as const,
  list: (params: DepartmentsQueryParams) =>
    [...departmentQueryKeys.all, 'list', params] as const,
}

export function useDepartmentsQuery(params: DepartmentsQueryParams) {
  return useQuery({
    queryKey: departmentQueryKeys.list(params),
    queryFn: () => getDepartments(params),
  })
}
