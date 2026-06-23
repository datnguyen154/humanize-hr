import { useQueries } from '@tanstack/react-query'

import { getAttendanceList } from '../../attendance/api/attendance.api'
import { attendanceQueryKeys } from '../../attendance/hooks/useAttendanceHistoryQuery'
import type { AttendanceListQueryParams } from '../../attendance/types/attendance.types'
import { getDepartments } from '../../department/api/department.api'
import { departmentQueryKeys } from '../../department/hooks/useDepartmentsQuery'
import type { DepartmentsQueryParams } from '../../department/types/department.types'
import { getEmployees } from '../../employee/api/employee.api'
import { employeeQueryKeys } from '../../employee/lib/employee.query-keys'
import type { EmployeesQueryParams } from '../../employee/types/employee.types'
import { getLeaveRequests } from '../../leave-request/api/leaveRequest.api'
import { leaveRequestQueryKeys } from '../../leave-request/hooks/useLeaveRequestsQuery'
import type { LeaveRequestsQueryParams } from '../../leave-request/types/leaveRequest.types'
import type { DashboardQueriesResult } from '../types/dashboard.types'

const dashboardEmployeesParams: EmployeesQueryParams = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const dashboardDepartmentsParams: DepartmentsQueryParams = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const dashboardAttendanceParams: AttendanceListQueryParams = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const dashboardLeaveRequestsParams: LeaveRequestsQueryParams = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

export function useDashboardQueries(): DashboardQueriesResult {
  const [employees, departments, attendance, leaveRequests] = useQueries({
    queries: [
      {
        queryKey: employeeQueryKeys.list(dashboardEmployeesParams),
        queryFn: () => getEmployees(dashboardEmployeesParams),
      },
      {
        queryKey: departmentQueryKeys.list(dashboardDepartmentsParams),
        queryFn: () => getDepartments(dashboardDepartmentsParams),
      },
      {
        queryKey: attendanceQueryKeys.list(dashboardAttendanceParams),
        queryFn: () => getAttendanceList(dashboardAttendanceParams),
      },
      {
        queryKey: leaveRequestQueryKeys.list(
          dashboardLeaveRequestsParams,
          'dashboard',
        ),
        queryFn: () => getLeaveRequests(dashboardLeaveRequestsParams),
      },
    ],
  })

  return {
    employees,
    departments,
    attendance,
    leaveRequests,
    isLoading:
      employees.isLoading ||
      departments.isLoading ||
      attendance.isLoading ||
      leaveRequests.isLoading,
    isError:
      employees.isError ||
      departments.isError ||
      attendance.isError ||
      leaveRequests.isError,
  }
}
