export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type LeaveRequestSortBy = 'createdAt' | 'startDate' | 'endDate'

export type LeaveRequestSortOrder = 'asc' | 'desc'

export type LeaveRequestEmployee = {
  id: string
  employeeCode: string
  fullName: string
}

export type LeaveRequestReviewer = {
  id: string
  fullName: string
}

export type LeaveRequest = {
  id: string
  employeeId: string
  employee: LeaveRequestEmployee
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
  status: LeaveRequestStatus
  reviewedBy: string | null
  reviewer: LeaveRequestReviewer | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
}

export type LeaveRequestsQueryParams = {
  page: number
  limit: number
  search?: string
  status?: LeaveRequestStatus
  employeeId?: string
  sortBy?: LeaveRequestSortBy
  sortOrder?: LeaveRequestSortOrder
}

export type LeaveRequestsMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type LeaveRequestsResponse = {
  data: LeaveRequest[]
  meta: LeaveRequestsMeta
}
