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

export type EmployeeDepartment = {
  id: string
  name: string
}

export type EmployeeDetail = Employee & {
  departmentId?: string | null
  department?: EmployeeDepartment | null
  createdAt: string
  updatedAt: string
}

export type MyEmployeeProfile = EmployeeDetail & {
  departmentId: string
  department: EmployeeDepartment
}

export type CreateEmployeeRequest = {
  employeeCode: string
  fullName: string
  email: string
  phone?: string
  position: string
  status: EmployeeStatus
  joinedAt: string
}

export type UpdateEmployeeRequest = CreateEmployeeRequest

export type UpdateEmployeeStatusResponse = {
  id: string
  status: EmployeeStatus
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
