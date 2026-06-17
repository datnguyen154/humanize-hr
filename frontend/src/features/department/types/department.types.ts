export type DepartmentStatus = 'ACTIVE' | 'INACTIVE'

export type DepartmentSortBy = 'name' | 'status' | 'createdAt' | 'updatedAt'

export type DepartmentSortOrder = 'asc' | 'desc'

export type Department = {
  id: string
  name: string
  description: string
  status: DepartmentStatus
  createdAt: string
  updatedAt: string
}

export type DepartmentDetail = Department

export type DepartmentDetailResponse = {
  data: DepartmentDetail
}

export type CreateDepartmentRequest = {
  name: string
  description?: string | null
  status?: DepartmentStatus
}

export type UpdateDepartmentRequest = {
  name?: string
  description?: string | null
  status?: DepartmentStatus
}

export type UpdateDepartmentStatusResponse = {
  id: string
  status: DepartmentStatus
}

export type DepartmentsQueryParams = {
  page: number
  limit: number
  search?: string
  status?: DepartmentStatus
  sortBy?: DepartmentSortBy
  sortOrder?: DepartmentSortOrder
}

export type DepartmentsMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type DepartmentsResponse = {
  data: Department[]
  meta: DepartmentsMeta
}
