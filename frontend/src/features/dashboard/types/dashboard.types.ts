import type { UseQueryResult } from '@tanstack/react-query'

import type {
  AttendanceListResponse,
  AttendanceRecord,
} from '../../attendance/types/attendance.types'
import type { Department } from '../../department/types/department.types'
import type { DepartmentsResponse } from '../../department/types/department.types'
import type { EmployeesResponse } from '../../employee/types/employee.types'
import type {
  LeaveRequest,
  LeaveRequestsResponse,
} from '../../leave-request/types/leaveRequest.types'

export type DashboardQueriesResult = {
  employees: UseQueryResult<EmployeesResponse, Error>
  departments: UseQueryResult<DepartmentsResponse, Error>
  attendance: UseQueryResult<AttendanceListResponse, Error>
  leaveRequests: UseQueryResult<LeaveRequestsResponse, Error>
  isLoading: boolean
  isError: boolean
}

export type DashboardActivityType =
  | 'attendance'
  | 'leave-request'
  | 'department'

export type DashboardActivity = {
  id: string
  type: DashboardActivityType
  message: string
  createdAt: string
}

export type DashboardActivityMapperInput = {
  attendanceRecords: AttendanceRecord[]
  leaveRequests: LeaveRequest[]
  departments: Department[]
}
