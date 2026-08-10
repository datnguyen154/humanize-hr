import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getDepartmentById, getDepartments } from '../api/department.api'
import type { DepartmentsQueryParams } from '../types/department.types'

export const departmentQueryKeys = {
  all: ['departments'] as const,
  options: () => [...departmentQueryKeys.all, 'options'] as const,
  list: (params: DepartmentsQueryParams) =>
    [...departmentQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...departmentQueryKeys.all, 'detail', id] as const,
}

export function useDepartmentsQuery(params: DepartmentsQueryParams) {
  return useQuery({
    queryKey: departmentQueryKeys.list(params),
    queryFn: () => getDepartments(params),
    placeholderData: keepPreviousData,
  })
}

export function useDepartmentDetailQuery(id: string) {
  return useQuery({
    queryKey: departmentQueryKeys.detail(id),
    queryFn: () => getDepartmentById(id),
    enabled: Boolean(id),
  })
}
