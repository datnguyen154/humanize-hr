import { useQuery } from '@tanstack/react-query'

import { getDepartments } from '../api/department.api'
import type { DepartmentOption } from '../types/department.types'
import { departmentQueryKeys } from './useDepartmentsQuery'

const DEPARTMENT_OPTIONS_LIMIT = 100

export function useDepartmentOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: departmentQueryKeys.options(),
    enabled,
    queryFn: async (): Promise<DepartmentOption[]> => {
      const firstPage = await getDepartments({
        page: 1,
        limit: DEPARTMENT_OPTIONS_LIMIT,
        sortBy: 'name',
        sortOrder: 'asc',
      })

      if (firstPage.meta.totalPages <= 1) {
        return firstPage.data
      }

      const remainingPages = await Promise.all(
        Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
          getDepartments({
            page: index + 2,
            limit: DEPARTMENT_OPTIONS_LIMIT,
            sortBy: 'name',
            sortOrder: 'asc',
          }),
        ),
      )

      return [
        ...firstPage.data,
        ...remainingPages.flatMap((page) => page.data),
      ]
    },
  })
}
