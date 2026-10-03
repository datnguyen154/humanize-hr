import { useQuery } from '@tanstack/react-query'

import { getAdminDashboard } from '../api/admin-dashboard.api'
import type { AdminDashboardDays } from '../types/dashboard.types'

export const adminDashboardQueryKeys = {
  all: ['admin-dashboard'] as const,
  period: (days: AdminDashboardDays) => [...adminDashboardQueryKeys.all, { days }] as const,
}

export function useAdminDashboardQuery(days: AdminDashboardDays) {
  return useQuery({
    queryKey: adminDashboardQueryKeys.period(days),
    queryFn: ({ signal }) => getAdminDashboard(days, signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Returning after an employee/department update must refresh the aggregate.
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })
}
