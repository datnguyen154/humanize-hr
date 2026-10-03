import type { AdminDashboardDays } from '../types/dashboard.types'

export const ADMIN_DASHBOARD_PERIODS = [
  { value: 7, label: '7 ngày gần nhất' },
  { value: 30, label: '30 ngày gần nhất' },
] as const satisfies readonly { value: AdminDashboardDays; label: string }[]

export const DEFAULT_ADMIN_DASHBOARD_DAYS = ADMIN_DASHBOARD_PERIODS[0].value

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
})

// The API sends calendar dates, not timestamps to shift into the browser timezone.
export const formatDashboardDate = (date: string) => dateFormatter.format(new Date(date))
