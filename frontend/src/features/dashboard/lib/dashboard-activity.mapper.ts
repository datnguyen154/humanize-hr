import type {
  DashboardActivity,
  AdminDashboardActivity,
  DashboardActivityType,
} from '../types/dashboard.types'

const activityMessages: Record<DashboardActivityType, (subject: string) => string> = {
  attendance: (subject) => `${subject} đã chấm công`,
  'leave-request': (subject) => `${subject} gửi đơn nghỉ phép`,
  department: (subject) => `Phòng ban ${subject} được tạo`,
}

export const mapDashboardActivities = (
  activities: AdminDashboardActivity[],
): DashboardActivity[] => activities.map(({ subject, ...activity }) => ({
  ...activity,
  message: activityMessages[activity.type](subject),
}))
