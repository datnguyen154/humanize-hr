export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'

export type EmployeeSortBy =
  | 'employeeCode'
  | 'fullName'
  | 'joinedAt'
  | 'createdAt'

export type EmployeeSortOrder = 'asc' | 'desc'

export type Employee = {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone: string
  position: string
  status: EmployeeStatus
  joinedAt: string
}

export type EmployeesQueryParams = {
  page: number
  limit: number
  search?: string
  status?: EmployeeStatus
  sortBy?: EmployeeSortBy
  sortOrder?: EmployeeSortOrder
}

export type EmployeesMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type EmployeesResponse = {
  data: Employee[]
  meta: EmployeesMeta
}
