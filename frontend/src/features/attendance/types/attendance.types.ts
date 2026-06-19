export type AttendanceStatus = 'PRESENT' | 'LATE'

export type AttendanceHistorySortOrder = 'asc' | 'desc'

export type AttendanceRecord = {
  id: string
  employeeId: string
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

export type AttendanceRecordResponse = {
  data: AttendanceRecord
}
