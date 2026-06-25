import { useQuery } from '@tanstack/react-query'

import { getEmployeeDashboard } from '../api/employee-dashboard.api'
import type { EmployeeDashboardQueryResult } from '../types/employee-dashboard.types'

const employeeDashboardQueryKey = ['employee-dashboard'] as const

export function useEmployeeDashboardQuery(): EmployeeDashboardQueryResult {
  const employeeDashboardQuery = useQuery({
    queryKey: employeeDashboardQueryKey,
    queryFn: getEmployeeDashboard,
  })

  return {
    todayAttendance: employeeDashboardQuery.data?.todayAttendance,
    attendanceSummary: employeeDashboardQuery.data?.attendanceSummary,
    leaveSummary: employeeDashboardQuery.data?.leaveSummary,
    recentActivities: employeeDashboardQuery.data?.recentActivities,
    isLoading: employeeDashboardQuery.isLoading,
    isError: employeeDashboardQuery.isError,
    isFetching: employeeDashboardQuery.isFetching,
    refetch: () => {
      void employeeDashboardQuery.refetch()
    },
  }
}
