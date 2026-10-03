import type { EmployeeSortBy, EmployeeSortOrder, EmployeeStatus } from '../types/employee.types'

export const EMPLOYEE_PAGE_SIZE = 10
export const EMPLOYEE_SEARCH_DELAY = 350
export type EmployeeListFilters = {
  page: number
  search: string
  status: 'ALL' | EmployeeStatus
  departmentId: string | undefined
  sortBy: EmployeeSortBy
  sortOrder: EmployeeSortOrder
}

export function readEmployeeListParams(params: URLSearchParams): EmployeeListFilters {
  const page = Number(params.get('page'))
  const status = params.get('status')
  const sortBy = params.get('sortBy')
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    search: params.get('search')?.trim() ?? '',
    status: status === 'ACTIVE' || status === 'INACTIVE' ? status : 'ALL',
    departmentId: params.get('departmentId')?.trim() || undefined,
    sortBy: sortBy === 'fullName' || sortBy === 'joinedAt' || sortBy === 'createdAt' ? sortBy : 'employeeCode',
    sortOrder: params.get('sortOrder') === 'desc' ? 'desc' : 'asc',
  }
}

export function writeEmployeeListParams(params: URLSearchParams, filters: EmployeeListFilters) {
  const next = new URLSearchParams(params)
  const values = {
    page: filters.page > 1 ? String(filters.page) : '',
    search: filters.search.trim(),
    status: filters.status === 'ALL' ? '' : filters.status,
    departmentId: filters.departmentId ?? '',
    sortBy: filters.sortBy === 'employeeCode' ? '' : filters.sortBy,
    sortOrder: filters.sortOrder === 'asc' ? '' : filters.sortOrder,
  }
  for (const [key, value] of Object.entries(values)) {
    if (value) next.set(key, value)
    else next.delete(key)
  }
  return next
}
