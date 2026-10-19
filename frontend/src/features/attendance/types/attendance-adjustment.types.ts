export type AttendanceAdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type AttendanceAdjustmentDecision = 'APPROVED' | 'REJECTED'

export type AttendanceAdjustment = {
  id: string
  employeeId: string
  attendanceId: string | null
  attendanceDate: string
  originalCheckInTime: string | null
  originalCheckOutTime: string | null
  originalUpdatedAt: string | null
  requestedCheckInTime: string
  requestedCheckOutTime: string | null
  reason: string
  status: AttendanceAdjustmentStatus
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  employee: { id: string; employeeCode: string; fullName: string }
  reviewer: { id: string; fullName: string } | null
  attendance: {
    id: string
    checkInTime: string
    checkOutTime: string | null
    status: 'PRESENT' | 'LATE'
  } | null
}

export type AttendanceAdjustmentListParams = {
  page: number
  limit: number
  status?: AttendanceAdjustmentStatus
  search?: string
}

export type AttendanceAdjustmentListResponse = {
  data: AttendanceAdjustment[]
  meta: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type CreateAttendanceAdjustmentRequest = {
  attendanceDate: string
  checkInTime: string
  checkOutTime: string | null
  reason: string
}

export type ReviewAttendanceAdjustmentRequest = {
  status: AttendanceAdjustmentDecision
  reviewNote: string | null
}
