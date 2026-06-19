export type AttendanceStatus = 'PRESENT' | 'LATE'

export type AttendanceHistorySortOrder = 'asc' | 'desc'

export type AttendanceSortBy =
  | 'attendanceDate'
  | 'checkInTime'
  | 'checkOutTime'
  | 'createdAt'

export type AttendanceSortOrder = 'asc' | 'desc'

export type AttendanceEmployee = {
  id: string
  employeeCode: string
  fullName: string
}

export type AttendanceRecord = {
  id: string
  employeeId: string
  employee: AttendanceEmployee
  attendanceDate: string
  checkInTime: string
  checkOutTime: string | null
  status: AttendanceStatus
  createdAt: string
  updatedAt: string
}

export type AttendanceHistoryQueryParams = {
  page: number
  limit: number
  status?: AttendanceStatus
  fromDate?: string
  toDate?: string
  sortBy?: 'attendanceDate'
  sortOrder?: AttendanceHistorySortOrder
}

export type AttendanceHistoryMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type AttendanceHistoryResponse = {
  data: AttendanceRecord[]
  meta: AttendanceHistoryMeta
}

export type AttendanceListQueryParams = {
  page: number
  limit: number
  search?: string
  status?: AttendanceStatus
  employeeId?: string
  fromDate?: string
  toDate?: string
  sortBy?: AttendanceSortBy
  sortOrder?: AttendanceSortOrder
}

export type AttendanceListResponse = AttendanceHistoryResponse

export type AttendanceRecordResponse = {
  data: AttendanceRecord
}
