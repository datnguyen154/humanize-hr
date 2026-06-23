import type { UseQueryResult } from '@tanstack/react-query'

import type { AttendanceListResponse } from '../../attendance/types/attendance.types'
import type { DepartmentsResponse } from '../../department/types/department.types'
import type { EmployeesResponse } from '../../employee/types/employee.types'
import type { LeaveRequestsResponse } from '../../leave-request/types/leaveRequest.types'

export type DashboardQueriesResult = {
  employees: UseQueryResult<EmployeesResponse, Error>
  departments: UseQueryResult<DepartmentsResponse, Error>
  attendance: UseQueryResult<AttendanceListResponse, Error>
  leaveRequests: UseQueryResult<LeaveRequestsResponse, Error>
  isLoading: boolean
  isError: boolean
}
