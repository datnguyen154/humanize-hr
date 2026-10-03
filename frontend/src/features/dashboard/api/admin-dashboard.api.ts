import { axiosInstance } from '@/shared/api'

import type { AdminDashboardDays, AdminDashboardResponse } from '../types/dashboard.types'

export async function getAdminDashboard(days: AdminDashboardDays, signal?: AbortSignal) {
  const response = await axiosInstance.get<AdminDashboardResponse>('/dashboard/admin', {
    params: { days },
    signal,
  })
  return response.data.data
}
