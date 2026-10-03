export type AdminDashboardDays = 7 | 30

export type AdminDashboardSummary = {
  totalEmployees: number
  totalDepartments: number
  totalLeaveRequests: number
  todayAttendance: number
}

export type AdminAttendanceTrendPoint = {
  date: string
  total: number
  present: number
  late: number
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

export type AdminDashboardActivity = Omit<DashboardActivity, 'message'> & {
  subject: string
}

export type AdminDashboard = {
  generatedAt: string
  period: {
    days: AdminDashboardDays
    fromDate: string
    toDate: string
  }
  summary: AdminDashboardSummary
  attendanceTrend: AdminAttendanceTrendPoint[]
  recentActivities: AdminDashboardActivity[]
}

export type AdminDashboardResponse = {
  data: AdminDashboard
}
